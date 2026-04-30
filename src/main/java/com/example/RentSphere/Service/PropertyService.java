package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.Property;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;

    public PropertyDetails addProperty(Property dto,int user_id,String coverPic) {
       return propertyRepository.addProperty(dto,user_id,coverPic);
    }

    public List <PropertyDetails> getAll() {
        return propertyRepository.findAll();
    }

    public PropertyDetails getById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
    }

    public void addImage(Long property_id, String image_url, boolean is_cover) {
        propertyRepository.saveImage(property_id, image_url, is_cover);
    }

    public void update(Property dto) {
        propertyRepository.update(dto);
    }

    public void delete(Long id) {
        propertyRepository.delete(id);
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

    public Favorite favorite(int property_id,int tenant_id){
        return propertyRepository.favorite(property_id,tenant_id);
    }

    public List <Favorite> getAllFavorites(int tenant_id){
        return propertyRepository.getAllFavorites(tenant_id);
    }
}
