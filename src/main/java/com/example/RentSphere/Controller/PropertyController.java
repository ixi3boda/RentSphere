package com.example.RentSphere.Controller;

import com.example.RentSphere.Dto.ErrorResponse;
import com.example.RentSphere.Dto.Property;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.User;
import com.example.RentSphere.Service.PropertyService;
import com.example.RentSphere.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;
    private final UserService userService;

    private ResponseEntity<?> buildErrorResponse(String message, HttpStatus status) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .error(status.getReasonPhrase())
                .build();
        return ResponseEntity.status(status).body(errorResponse);
    }

    @PostMapping("/{propertyId}/images/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addPropertyImage(
            @PathVariable Long property_id,
            @RequestParam String image_url,
            @RequestParam(defaultValue = "false") boolean is_cover
    ) {
        try {
            propertyService.addImage(property_id, image_url, is_cover);
            return ResponseEntity.ok("Image added successfully");
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse(
                    "Failed to add image: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @PostMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addProperty(@RequestBody Property dto,@RequestParam(required = false) String coverPic, Principal principal) {
        try {
            String email = principal.getName();
            int user_id = userService.getCurrentUser(email).getUser_id();
            propertyService.addProperty(dto,user_id,coverPic);
            return ResponseEntity.ok("Property created successfully");
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to create property: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        try {
            List<PropertyDetails> properties = propertyService.getAll();
            return ResponseEntity.ok(properties);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch properties: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
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
            return buildErrorResponse("Failed to fetch property: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@RequestBody Property dto) {
        try {
            propertyService.update(dto);
            return ResponseEntity.ok("Property updated successfully");
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to update property: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            propertyService.delete(id);
            return ResponseEntity.ok("Property deleted successfully");
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to delete property: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer numRooms,
            @RequestParam(required = false) Boolean isAvailable
    ) {
        try {
            return ResponseEntity.ok(
                    propertyService.filterProperties(
                            city,
                            district,
                            minPrice,
                            maxPrice,
                            numRooms,
                            isAvailable
                    )
            );
        } catch (Exception e) {
            return buildErrorResponse(
                    "Failed to search properties: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String prefix) {
        try {
            return ResponseEntity.ok(propertyService.searchByPrefix(prefix));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse(
                    "Search failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @GetMapping("/favorite")
    public ResponseEntity<?> favorite(@RequestParam int property_id, Principal principal) {
        try {
            String email = principal.getName();
            User userDetails = userService.getCurrentUser(email);
            int tenant_id = userDetails.getUser_id();
            return ResponseEntity.ok(propertyService.favorite(property_id,tenant_id));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse(
                    "Favorite failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @GetMapping("/favorites/all")
    public ResponseEntity<?> getAllfavorites(Principal principal) {
        try {
            String email = principal.getName();
            User userDetails = userService.getCurrentUser(email);
            int tenant_id = userDetails.getUser_id();
            return ResponseEntity.ok(propertyService.getAllFavorites(tenant_id));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse(
                    "Favorite List failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


}