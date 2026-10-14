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
                .pricePerMonth(new java.math.BigDecimal("5000.0"))
                .city("Dammam")
                .build();

        
        PropertyDetails details = propertyRepository.addProperty(req, 1);

        assertThat(details.getProperty().getPropertyId()).isGreaterThan(0);
        assertThat(details.getProperty().getTitle()).isEqualTo("New Integration Property");
    }

    @Test
    @DisplayName("update modifies existing property")
    void update_modifiesProperty() {
        UpdatePropertyRequest req = UpdatePropertyRequest.builder()
                .title("Updated Title")
                .pricePerMonth(new java.math.BigDecimal("2000.00"))
                .build();

        int rows = propertyRepository.update(1L, req);
        assertThat(rows).isEqualTo(1);

        PropertyDetails updated = propertyRepository.findById(1L).get();
        assertThat(updated.getProperty().getTitle()).isEqualTo("Updated Title");
        assertThat(updated.getProperty().getPricePerMonth()).isEqualByComparingTo("2000.00");
    }

    @Test
    @DisplayName("delete removes property")
    void delete_removesProperty() {
        
        
        CreatePropertyRequest req = CreatePropertyRequest.builder()
                .title("To Delete").propertyType("APARTMENT").pricePerMonth(new java.math.BigDecimal("100.0")).build();
        PropertyDetails created = propertyRepository.addProperty(req, 1);
        long newId = created.getProperty().getPropertyId();

        int rows = propertyRepository.delete(newId);
        assertThat(rows).isEqualTo(1);

        assertThat(propertyRepository.findById(newId)).isEmpty();
    }

    @Test
    @DisplayName("filterProperties search term matches against title, city or district")
    void filterProperties_searchMatchesTitleSubstring() {
        PropertyRepository.PropertyFilter filter = new PropertyRepository.PropertyFilter(
                "apart", null, null, null, null, null, null, null);

        List<PropertyDetails> results = propertyRepository.filterProperties(filter, "newest", 12, 0);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getProperty().getTitle()).contains("Apartment");
    }

    @Test
    @DisplayName("favorite adds property to favorites")
    void favorite_addsToFavorites() {
        
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

    private PropertyRepository.PropertyFilter filterOf(String city, String type, Double maxPrice) {
        return new PropertyRepository.PropertyFilter(null, city, null, type, null, maxPrice, null, null);
    }

    @Test
    @DisplayName("filterProperties matches a lowercase type against the uppercased stored value")
    void filterProperties_lowerCaseTypeMatches() {
        List<PropertyDetails> results = propertyRepository.filterProperties(
                filterOf(null, "apartment", null), "newest", 12, 0);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getProperty().getTitle()).isEqualTo("Test Apartment");
    }

    @Test
    @DisplayName("countFilterProperties agrees with the rows the same filter returns")
    void countFilterProperties_matchesFilteredRows() {
        PropertyRepository.PropertyFilter filter = filterOf("Riyadh", null, null);

        assertThat(propertyRepository.countFilterProperties(filter))
                .isEqualTo(propertyRepository.filterProperties(filter, "newest", 12, 0).size());
    }

    @Test
    @DisplayName("filterProperties orders by price and honours limit/offset")
    void filterProperties_priceAscendingPagination() {
        List<PropertyDetails> firstPage = propertyRepository.filterProperties(
                filterOf(null, null, null), "price_asc", 1, 0);
        List<PropertyDetails> secondPage = propertyRepository.filterProperties(
                filterOf(null, null, null), "price_asc", 1, 1);

        assertThat(firstPage.get(0).getProperty().getTitle()).isEqualTo("Test Apartment");
        assertThat(secondPage.get(0).getProperty().getTitle()).isEqualTo("Luxury Villa");
    }

    @Test
    @DisplayName("filterProperties ignores an unknown sort key instead of failing")
    void filterProperties_unknownSortKeyFallsBack() {
        List<PropertyDetails> results = propertyRepository.filterProperties(
                filterOf(null, null, null), "price_asc; DROP TABLE properties", 12, 0);

        assertThat(results).hasSize(2);
        // The injected fragment must never reach ORDER BY, so the rows are still there
        assertThat(propertyRepository.countAll()).isEqualTo(2);
    }
}
