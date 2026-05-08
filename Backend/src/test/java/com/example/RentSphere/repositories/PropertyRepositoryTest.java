package com.example.RentSphere.repositories;

import com.example.RentSphere.Dto.CreatePropertyRequest;
import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.Property;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.UpdatePropertyRequest;
import com.example.RentSphere.Repository.PropertyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("PropertyRepository Integration Tests")
class PropertyRepositoryTest {

    @Autowired
    private PropertyRepository propertyRepository;

    @Test
    @DisplayName("findAll returns list of properties with images")
    void findAll_returnsProperties() {
        List<PropertyDetails> list = propertyRepository.findAll();
        assertThat(list).isNotEmpty();
        // data-test.sql seeds 2 properties
        assertThat(list.size()).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("findById returns property details when exists")
    void findById_returnsProperty() {
        Optional<PropertyDetails> opt = propertyRepository.findById(1L);
        assertThat(opt).isPresent();
        assertThat(opt.get().getProperty().getTitle()).isEqualTo("Test Apartment");
    }

    @Test
    @DisplayName("findById returns empty when not exists")
    void findById_returnsEmpty() {
        Optional<PropertyDetails> opt = propertyRepository.findById(999L);
        assertThat(opt).isEmpty();
    }

    @Test
    @DisplayName("addProperty creates new property and returns details")
    void addProperty_createsProperty() {
        CreatePropertyRequest req = CreatePropertyRequest.builder()
                .title("New Integration Property")
                .propertyType("VILLA")
                .pricePerMonth(5000.0)
                .city("Dammam")
                .build();
                
        // admin is user 1
        PropertyDetails details = propertyRepository.addProperty(req, 1);
        
        assertThat(details.getProperty().getPropertyId()).isGreaterThan(0);
        assertThat(details.getProperty().getTitle()).isEqualTo("New Integration Property");
    }

    @Test
    @DisplayName("update modifies existing property")
    void update_modifiesProperty() {
        UpdatePropertyRequest req = UpdatePropertyRequest.builder()
                .title("Updated Title")
                .pricePerMonth(2000.0)
                .build();
                
        int rows = propertyRepository.update(1L, req);
        assertThat(rows).isEqualTo(1);
        
        PropertyDetails updated = propertyRepository.findById(1L).get();
        assertThat(updated.getProperty().getTitle()).isEqualTo("Updated Title");
        assertThat(updated.getProperty().getPricePerMonth()).isEqualTo(2000.0);
    }

    @Test
    @DisplayName("delete removes property")
    void delete_removesProperty() {
        // Since property 1 has foreign keys in rental_requests, we should test with a new one
        CreatePropertyRequest req = CreatePropertyRequest.builder()
                .title("To Delete").propertyType("APARTMENT").pricePerMonth(100.0).build();
        PropertyDetails created = propertyRepository.addProperty(req, 1);
        long newId = created.getProperty().getPropertyId();
        
        int rows = propertyRepository.delete(newId);
        assertThat(rows).isEqualTo(1);
        
        assertThat(propertyRepository.findById(newId)).isEmpty();
    }

    @Test
    @DisplayName("searchByPrefix finds matching properties")
    void searchByPrefix_findsMatches() {
        List<PropertyDetails> results = propertyRepository.searchByPrefix("Test");
        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getProperty().getTitle()).contains("Test");
    }

    @Test
    @DisplayName("favorite adds property to favorites")
    void favorite_addsToFavorites() {
        // tenant = user 2, property = 2 (not favorited yet)
        Favorite fav = propertyRepository.favorite(2, 2);
        
        assertThat(fav).isNotNull();
        assertThat(fav.getPropertyDetails().getProperty().getPropertyId()).isEqualTo(2);
    }

    @Test
    @DisplayName("getAllFavorites returns user's favorites")
    void getAllFavorites_returnsFavorites() {
        propertyRepository.favorite(2, 2);
        List<Favorite> favorites = propertyRepository.getAllFavorites(2);
        
        assertThat(favorites).isNotEmpty();
    }
}
