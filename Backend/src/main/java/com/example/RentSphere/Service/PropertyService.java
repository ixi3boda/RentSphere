package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.CreatePropertyRequest;
import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.UpdatePropertyRequest;
import com.example.RentSphere.Exception.BadRequestException;
import com.example.RentSphere.Exception.ResourceNotFoundException;
import com.example.RentSphere.Repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business-logic layer for property listing operations.
 *
 * <p>This service is the single authoritative gateway between the controller layer and
 * {@link PropertyRepository}. It enforces ownership rules (an owner may only mutate
 * their own listings), validates inputs that the repository cannot check on its own,
 * and translates repository results into the {@link PropertyDetails} view objects that
 * controllers expose over the REST API.
 *
 * <p>All ownership checks throw {@link IllegalArgumentException} rather than a
 * security exception so that the controller can map them to {@code 403 Forbidden}
 * via the global exception handler without coupling the service layer to HTTP
 * semantics.
 */
@Service
@RequiredArgsConstructor
public class PropertyService {

    private static final int MAX_IMAGES_PER_PROPERTY = 10;

    private final PropertyRepository propertyRepository;

    /**
     * Creates a new property listing owned by the given user.
     *
     * @param request  validated creation payload from the REST layer
     * @param userId   database ID of the authenticated owner
     * @return a {@link PropertyDetails} view of the newly persisted listing, including
     *         the cover image if one was supplied in the request
     */
    public PropertyDetails addProperty(CreatePropertyRequest request, int userId) {
        return propertyRepository.addProperty(request, userId);
    }

    /**
     * Returns all listings owned by the specified user, ordered by creation date (newest first).
     * Images are loaded in a single batched query to avoid N+1 overhead.
     *
     * @param ownerId database ID of the property owner
     * @return list of {@link PropertyDetails}; empty if the owner has no listings
     */
    public List<PropertyDetails> getByOwnerId(int ownerId) {
        return propertyRepository.findByOwnerId(ownerId);
    }

    /**
     * Returns the total number of properties in the marketplace regardless of availability.
     * Used by the hero-section stats counter on the home page.
     *
     * @return total property count
     */
    public int countListings() {
        return propertyRepository.countAll();
    }

    /**
     * Returns the number of properties currently marked as available ({@code is_available = TRUE}).
     * Used by the hero-section stats counter on the home page.
     *
     * @return available property count
     */
    public int countAvailableListings() {
        return propertyRepository.countAvailable();
    }

    /**
     * Returns a sorted, deduplicated list of all city names present in the properties table.
     * Used to populate the city filter drop-down on the browse page.
     *
     * @return alphabetically ordered list of city names; never {@code null}
     */
    public List<String> getCities() {
        return propertyRepository.findDistinctCities();
    }

    /**
     * Fetches a single property by its primary key, including all attached images.
     *
     * @param id the property's primary key
     * @return the matching {@link PropertyDetails}
     * @throws ResourceNotFoundException if no property with the given ID exists
     */
    public PropertyDetails getById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + id));
    }

    /**
     * Attaches an image to a property without an ownership check.
     * Internal use only - call {@link #addImageByOwner} for user-facing operations.
     *
     * @param propertyId the target property's ID
     * @param imageUrl   URL of the image to attach (e.g., a Cloudinary URL)
     * @param isCover    {@code true} to flag this image as the listing's cover photo
     */
    public void addImage(Long propertyId, String imageUrl, boolean isCover) {
        propertyRepository.saveImage(propertyId, imageUrl, isCover);
    }

    /**
     * Attaches an image to a property after verifying that the caller is the property owner.
     *
     * @param propertyId    the target property's ID
     * @param imageUrl      URL of the image to attach
     * @param isCover       {@code true} to flag as cover photo
     * @param currentUserId database ID of the authenticated caller
     * @throws ResourceNotFoundException if the property does not exist
     * @throws IllegalArgumentException  if the caller is not the property owner
     */
    public void addImageByOwner(Long propertyId, String imageUrl, boolean isCover, int currentUserId) {
        PropertyDetails propertyDetails = getById(propertyId);
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new ResourceNotFoundException("Property not found");
        }
        if (propertyDetails.getProperty().getOwnerId() == null ||
            !propertyDetails.getProperty().getOwnerId().equals((long) currentUserId)) {
            throw new IllegalArgumentException("You do not have permission to add images to this property");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new BadRequestException("Image URL is required");
        }
        if (propertyDetails.getPropertyImages() != null
                && propertyDetails.getPropertyImages().size() >= MAX_IMAGES_PER_PROPERTY) {
            throw new BadRequestException("A listing can have at most " + MAX_IMAGES_PER_PROPERTY + " images");
        }
        addImage(propertyId, imageUrl, isCover);
    }

    /**
     * Applies a partial update to a property without an ownership check.
     * Internal use only - call {@link #updateByOwner} for user-facing operations.
     *
     * @param propertyId the target property's ID
     * @param request    partial update payload; only non-null fields are applied
     * @throws IllegalArgumentException if {@code request} is {@code null}
     * @throws RuntimeException         if the property does not exist
     */
    public void update(Long propertyId, UpdatePropertyRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Update payload is required");
        }
        int rowsUpdated = propertyRepository.update(propertyId, request);
        if (rowsUpdated == 0) {
            throw new ResourceNotFoundException("Property not found");
        }
    }

    /**
     * Applies a partial update to a property after verifying that the caller is the owner.
     *
     * @param propertyId    the target property's ID
     * @param request       partial update payload; only non-null fields are applied
     * @param currentUserId database ID of the authenticated caller
     * @throws ResourceNotFoundException if the property does not exist
     * @throws IllegalArgumentException  if the caller is not the property owner
     */
    public void updateByOwner(Long propertyId, UpdatePropertyRequest request, int currentUserId) {
        PropertyDetails propertyDetails = getById(propertyId);
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new ResourceNotFoundException("Property not found");
        }
        if (propertyDetails.getProperty().getOwnerId() == null ||
            !propertyDetails.getProperty().getOwnerId().equals((long) currentUserId)) {
            throw new IllegalArgumentException("You do not have permission to update this property");
        }
        update(propertyId, request);
    }

    /**
     * Takes a listing off the market or puts it back. Called when a lease starts or ends.
     *
     * @param propertyId the target property's ID
     * @param available  the new availability flag
     */
    public void setAvailability(Long propertyId, boolean available) {
        propertyRepository.updateAvailability(propertyId, available);
    }

    /**
     * Deletes a property without an ownership check.
     * Internal use only - call {@link #deleteByOwner} for user-facing operations.
     *
     * @param id the property's primary key
     * @throws RuntimeException if the property does not exist
     */
    public void delete(Long id) {
        int deleted = propertyRepository.delete(id);
        if (deleted == 0) {
            throw new ResourceNotFoundException("Property not found");
        }
    }

    /**
     * Deletes a property after verifying that the caller is the owner.
     *
     * @param id            the property's primary key
     * @param currentUserId database ID of the authenticated caller
     * @throws ResourceNotFoundException if the property does not exist
     * @throws IllegalArgumentException  if the caller is not the property owner
     */
    public void deleteByOwner(Long id, int currentUserId) {
        PropertyDetails propertyDetails = getById(id);
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new ResourceNotFoundException("Property not found");
        }
        if (propertyDetails.getProperty().getOwnerId() == null ||
            !propertyDetails.getProperty().getOwnerId().equals((long) currentUserId)) {
            throw new IllegalArgumentException("You do not have permission to delete this property");
        }
        delete(id);
    }

    /**
     * Returns a page of properties matching the supplied filter criteria, sorted as requested.
     *
     * <p>The page size is capped at {@code MAX_PAGE_SIZE} (48) in the controller before
     * this method is called. The search field uses MySQL {@code MATCH...AGAINST} with the
     * {@code idx_properties_fulltext} index when the term is two or more characters.
     *
     * @param filter  the set of filter predicates (city, type, price range, free-text search, etc.)
     * @param sortBy  sort key - one of {@code "newest"}, {@code "price_asc"}, {@code "price_desc"}
     * @param page    zero-based page number
     * @param size    page size (already clamped by the controller)
     * @return the matching {@link PropertyDetails} objects for the requested page
     */
    public List<PropertyDetails> filterProperties(
            PropertyRepository.PropertyFilter filter,
            String sortBy,
            int page,
            int size
    ) {
        return propertyRepository.filterProperties(filter, sortBy, size, page * size);
    }

    /**
     * Returns the total number of properties that satisfy the filter predicates.
     * Called alongside {@link #filterProperties} so the UI can render accurate pagination.
     *
     * @param filter  the filter predicates to count against
     * @return total matching property count (not just the current page)
     */
    public int countFilterProperties(PropertyRepository.PropertyFilter filter) {
        return propertyRepository.countFilterProperties(filter);
    }

    /**
     * Toggles a saved-listing (favourite) relationship between a tenant and a property.
     * If the relationship already exists it is removed; if it does not exist it is created.
     * The composite primary key {@code (tenant_id, property_id)} makes re-saving idempotent
     * at the database level.
     *
     * @param propertyId the property to toggle
     * @param tenantId   the tenant performing the action
     * @return a {@link Favorite} snapshot reflecting the post-toggle state
     */
    public Favorite favorite(int propertyId, int tenantId) {
        return propertyRepository.favorite(propertyId, tenantId);
    }

    /**
     * Returns all properties saved as favourites by the specified tenant.
     *
     * @param tenantId database ID of the tenant
     * @return list of {@link Favorite} objects; empty if the tenant has no saved listings
     */
    public List<Favorite> getAllFavorites(int tenantId) {
        return propertyRepository.getAllFavorites(tenantId);
    }
}
