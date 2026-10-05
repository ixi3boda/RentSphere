package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.CreatePropertyRequest;
import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.UpdatePropertyRequest;
import com.example.RentSphere.Exception.ResourceNotFoundException;
import com.example.RentSphere.Repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;

    public PropertyDetails addProperty(CreatePropertyRequest request, int userId) {
        return propertyRepository.addProperty(request, userId);
    }

    public List<PropertyDetails> getByOwnerId(int ownerId) {
        return propertyRepository.findByOwnerId(ownerId);
    }

    public int countListings() {
        return propertyRepository.countAll();
    }

    public int countAvailableListings() {
        return propertyRepository.countAvailable();
    }

    public List<String> getCities() {
        return propertyRepository.findDistinctCities();
    }

    public PropertyDetails getById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + id));
    }

    public void addImage(Long propertyId, String imageUrl, boolean isCover) {
        propertyRepository.saveImage(propertyId, imageUrl, isCover);
    }

    public void addImageByOwner(Long propertyId, String imageUrl, boolean isCover, int currentUserId) {
        PropertyDetails propertyDetails = getById(propertyId);
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new RuntimeException("Property not found");
        }
        if (propertyDetails.getProperty().getOwnerId() == null ||
            !propertyDetails.getProperty().getOwnerId().equals((long) currentUserId)) {
            throw new IllegalArgumentException("You do not have permission to add images to this property");
        }
        addImage(propertyId, imageUrl, isCover);
    }

    public void update(Long propertyId, UpdatePropertyRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Update payload is required");
        }
        int rowsUpdated = propertyRepository.update(propertyId, request);
        if (rowsUpdated == 0) {
            throw new RuntimeException("Property not found");
        }
    }

    public void updateByOwner(Long propertyId, UpdatePropertyRequest request, int currentUserId) {
        PropertyDetails propertyDetails = getById(propertyId);
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new RuntimeException("Property not found");
        }
        if (propertyDetails.getProperty().getOwnerId() == null ||
            !propertyDetails.getProperty().getOwnerId().equals((long) currentUserId)) {
            throw new IllegalArgumentException("You do not have permission to update this property");
        }
        update(propertyId, request);
    }

    public void delete(Long id) {
        int deleted = propertyRepository.delete(id);
        if (deleted == 0) {
            throw new RuntimeException("Property not found");
        }
    }

    public void deleteByOwner(Long id, int currentUserId) {
        PropertyDetails propertyDetails = getById(id);
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new RuntimeException("Property not found");
        }
        if (propertyDetails.getProperty().getOwnerId() == null ||
            !propertyDetails.getProperty().getOwnerId().equals((long) currentUserId)) {
            throw new IllegalArgumentException("You do not have permission to delete this property");
        }
        delete(id);
    }

    public List<PropertyDetails> filterProperties(
            PropertyRepository.PropertyFilter filter,
            String sortBy,
            int page,
            int size
    ) {
        return propertyRepository.filterProperties(filter, sortBy, size, page * size);
    }

    public int countFilterProperties(PropertyRepository.PropertyFilter filter) {
        return propertyRepository.countFilterProperties(filter);
    }

    public Favorite favorite(int propertyId, int tenantId) {
        return propertyRepository.favorite(propertyId, tenantId);
    }

    public List<Favorite> getAllFavorites(int tenantId) {
        return propertyRepository.getAllFavorites(tenantId);
    }
}
