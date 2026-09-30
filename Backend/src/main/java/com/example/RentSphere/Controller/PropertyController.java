package com.example.RentSphere.Controller;

import com.example.RentSphere.Dto.CreatePropertyRequest;
import com.example.RentSphere.Dto.ErrorResponse;
import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.UpdatePropertyRequest;
import com.example.RentSphere.Dto.User;
import com.example.RentSphere.Repository.PropertyRepository;
import com.example.RentSphere.Service.ContractService;
import com.example.RentSphere.Service.PropertyService;
import com.example.RentSphere.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private static final int MAX_PAGE_SIZE = 48;

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

    record AddImageRequest(String image_url, Boolean is_cover) {}

    @PostMapping("/{id}/images/add")
    public ResponseEntity<?> addPropertyImage(
            @PathVariable Long id,
            @RequestBody AddImageRequest body,
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
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
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
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch property", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}/update")
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
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to update property", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}/delete")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            propertyService.deleteByOwner(id, currentUserId);
            return ResponseEntity.ok("Property deleted successfully");
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to delete property", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

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
        try {
            PropertyRepository.PropertyFilter filter = new PropertyRepository.PropertyFilter(
                    search, city, district, propertyType, minPrice, maxPrice, numRooms, isAvailable);

            int safePage = Math.max(0, page);
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

    @PostMapping("/{propertyId}/favorite")
    public ResponseEntity<?> favorite(
            @PathVariable int propertyId,
            Principal principal
    ) {
        try {
            String email = getPrincipalEmail(principal);
            int tenantId = userService.getCurrentUser(email).getUser_id();
            return ResponseEntity.ok(propertyService.favorite(propertyId, tenantId));
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
