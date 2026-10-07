package com.example.RentSphere.Controller;

import com.example.RentSphere.Dto.CreatePropertyRequest;
import com.example.RentSphere.Dto.ErrorResponse;
import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.UpdatePropertyRequest;
import com.example.RentSphere.Dto.InputRules;
import com.example.RentSphere.Exception.BadRequestException;
import com.example.RentSphere.Exception.ResourceNotFoundException;
import com.example.RentSphere.Repository.PropertyRepository;
import com.example.RentSphere.Service.ContractService;
import com.example.RentSphere.Service.PropertyService;
import com.example.RentSphere.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST controller for property listing operations.
 *
 * <p>All endpoints are mapped under {@code /api/properties}. Public endpoints
 * (browse, filter, single-listing detail) require no authentication. Owner-level
 * mutations (create, update, delete, add image) require the caller to be authenticated
 * and - for update/delete - to be the property owner. Creating a listing is
 * additionally restricted to users with the {@code ADMIN} role.
 *
 * <p>Ownership checks are delegated to the service layer; this controller is
 * responsible only for HTTP mapping and error-to-status translation.
 *
 * <p>The browse/filter endpoint ({@code GET /filter}) caps the page size at
 * {@value #MAX_PAGE_SIZE} to prevent unbounded responses on large datasets.
 * Search is handled via MySQL {@code MATCH...AGAINST} on the {@code idx_properties_fulltext}
 * index (defined in {@code Database/Schema.sql}) when the term is two or more characters.
 */
@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private static final int MAX_PAGE_SIZE = 48;
    // Deep enough for any real catalogue, and keeps page * size inside an int.
    private static final int MAX_PAGE = 100_000;
    private static final int MAX_FILTER_TEXT = 100;

    private final PropertyService propertyService;
    private final UserService userService;
    private final ContractService contractService;

    private String getPrincipalEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalStateException("Unauthorized access");
        }
        return principal.getName();
    }

    private ResponseEntity<?> buildErrorResponse(String message, HttpStatus status) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .error(status.getReasonPhrase())
                .build();
        return ResponseEntity.status(status).body(errorResponse);
    }

    @PostMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addProperty(
            @RequestBody @Valid CreatePropertyRequest request,
            Principal principal
    ) {
        try {
            String email = getPrincipalEmail(principal);
            int userId = userService.getCurrentUser(email).getUser_id();
            PropertyDetails created = propertyService.addProperty(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to create property", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    record AddImageRequest(
            @NotBlank @Size(max = 500)
            @Pattern(regexp = InputRules.IMAGE_URL, message = "must be an https URL") String image_url,
            Boolean is_cover) {}

    @PostMapping("/{id}/images/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addPropertyImage(
            @PathVariable Long id,
            @RequestBody @Valid AddImageRequest body,
            Principal principal
    ) {
        String image_url = body.image_url();
        boolean is_cover = body.is_cover() != null && body.is_cover();
        try {
            String email = getPrincipalEmail(principal);
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            propertyService.addImageByOwner(id, image_url, is_cover, currentUserId);
            return ResponseEntity.ok("Image added successfully");
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (BadRequestException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to add image", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getMarketplaceStats() {
        try {
            return ResponseEntity.ok(Map.of(
                    "totalListings", propertyService.countListings(),
                    "availableListings", propertyService.countAvailableListings(),
                    "activeLeases", contractService.countActiveContracts()
            ));
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch marketplace stats", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/cities")
    public ResponseEntity<?> getCities() {
        try {
            return ResponseEntity.ok(propertyService.getCities());
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch cities", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getMyProperties(Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            int userId = userService.getCurrentUser(email).getUser_id();
            return ResponseEntity.ok(propertyService.getByOwnerId(userId));
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch your properties", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(propertyService.getById(id));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (BadRequestException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch property", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody @Valid UpdatePropertyRequest request,
            Principal principal
    ) {
        try {
            String email = getPrincipalEmail(principal);
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            propertyService.updateByOwner(id, request, currentUserId);
            return ResponseEntity.ok("Property updated successfully");
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (BadRequestException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to update property", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}/delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            propertyService.deleteByOwner(id, currentUserId);
            return ResponseEntity.ok("Property deleted successfully");
        } catch (DataIntegrityViolationException e) {
            // contracts reference the listing with ON DELETE RESTRICT
            return buildErrorResponse("A property with rental contracts cannot be deleted", HttpStatus.CONFLICT);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (BadRequestException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to delete property", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns a paginated, filtered view of the property catalogue.
     *
     * <p>All parameters are optional; omitting them returns all available properties,
     * newest-first, paginated at the default size of 12. Sort order is validated against
     * a whitelist in the repository to prevent SQL injection via the {@code ORDER BY} clause.
     *
     * <p>The response envelope includes {@code items}, {@code total}, {@code page}, and
     * {@code size} so the UI can render accurate pagination without a separate count request.
     *
     * @param search       free-text term matched against title, city, district, and description
     * @param city         exact city name filter
     * @param district     exact district name filter
     * @param propertyType one of the values in the {@code chk_type} CHECK constraint
     * @param minPrice     minimum monthly rent (inclusive)
     * @param maxPrice     maximum monthly rent (inclusive)
     * @param numRooms     exact room count filter
     * @param isAvailable  {@code true} to show only available listings
     * @param sortBy       sort key - one of {@code newest}, {@code price_asc}, {@code price_desc}
     * @param page         zero-based page number (defaults to 0)
     * @param size         page size, clamped to [{@code 1}, {@value #MAX_PAGE_SIZE}] (defaults to 12)
     * @return paginated result envelope
     */
    @GetMapping("/filter")
    public ResponseEntity<?> filterProperties(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String propertyType,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer numRooms,
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size
    ) {
        if (tooLong(search) || tooLong(city) || tooLong(district) || tooLong(propertyType) || tooLong(sortBy)
                || badPrice(minPrice) || badPrice(maxPrice)
                || (numRooms != null && (numRooms < 0 || numRooms > 100))) {
            return buildErrorResponse("Invalid search filters", HttpStatus.BAD_REQUEST);
        }
        try {
            PropertyRepository.PropertyFilter filter = new PropertyRepository.PropertyFilter(
                    search, city, district, propertyType, minPrice, maxPrice, numRooms, isAvailable);

            int safePage = Math.min(MAX_PAGE, Math.max(0, page));
            int safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, size));
            int total = propertyService.countFilterProperties(filter);

            return ResponseEntity.ok(Map.of(
                    "items", propertyService.filterProperties(filter, sortBy, safePage, safeSize),
                    "total", total,
                    "page", safePage,
                    "size", safeSize
            ));
        } catch (Exception e) {
            return buildErrorResponse("Failed to search properties", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private static boolean tooLong(String value) {
        return value != null && value.length() > MAX_FILTER_TEXT;
    }

    private static boolean badPrice(Double value) {
        return value != null && (value.isNaN() || value.isInfinite() || value < 0);
    }

    @PostMapping("/{propertyId}/favorite")
    public ResponseEntity<?> favorite(
            @PathVariable int propertyId,
            Principal principal
    ) {
        try {
            String email = getPrincipalEmail(principal);
            int tenantId = userService.getCurrentUser(email).getUser_id();
            return ResponseEntity.ok(propertyService.favorite(propertyId, tenantId));
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Favorite failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/favorites/all")
    public ResponseEntity<?> getAllFavorites(Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            int tenantId = userService.getCurrentUser(email).getUser_id();
            return ResponseEntity.ok(propertyService.getAllFavorites(tenantId));
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Favorite list failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
