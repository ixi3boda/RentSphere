package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.CreatePropertyRequest;
import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.UpdatePropertyRequest;
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

    public List<PropertyDetails> getAll() {
        return propertyRepository.findAll();
    }

    public PropertyDetails getById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
    }

    public void addImage(Long propertyId, String imageUrl, boolean isCover) {
        propertyRepository.saveImage(propertyId, imageUrl, isCover);
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

    public void delete(Long id) {
        int deleted = propertyRepository.delete(id);
        if (deleted == 0) {
            throw new RuntimeException("Property not found");
        }
    }

    public List<PropertyDetails> filterProperties(
            String city,
            String district,
            Double minPrice,
            Double maxPrice,
            Integer numRooms,
            Boolean isAvailable
    ) {
        return propertyRepository.filterProperties(
                city,
                district,
                minPrice,
                maxPrice,
                numRooms,
                isAvailable
        );
    }

    public List<PropertyDetails> searchByPrefix(String prefix) {
        return propertyRepository.searchByPrefix(prefix.trim());
    }

    public Favorite favorite(int propertyId, int tenantId) {
        return propertyRepository.favorite(propertyId, tenantId);
    }

    public List<Favorite> getAllFavorites(int tenantId) {
        return propertyRepository.getAllFavorites(tenantId);
    }
}
