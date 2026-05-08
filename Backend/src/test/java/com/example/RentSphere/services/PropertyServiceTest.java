package com.example.RentSphere.services;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Repository.PropertyRepository;
import com.example.RentSphere.Service.PropertyService;
import com.example.RentSphere.fixtures.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PropertyService.
 * PropertyRepository is mocked — no database interaction.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PropertyService Unit Tests")
class PropertyServiceTest {

    @Mock private PropertyRepository propertyRepository;
    @InjectMocks private PropertyService propertyService;

    // ── addProperty ────────────────────────────────────────────────

    @Test
    @DisplayName("addProperty — delegates to repository")
    void addProperty_delegatesToRepository() {
        CreatePropertyRequest req = TestFixtures.validCreatePropertyRequest();
        PropertyDetails expected = new PropertyDetails();
        when(propertyRepository.addProperty(req, 1)).thenReturn(expected);

        PropertyDetails result = propertyService.addProperty(req, 1);
        assertThat(result).isSameAs(expected);
        verify(propertyRepository).addProperty(req, 1);
    }

    // ── getAll ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getAll — returns list from repository")
    void getAll_returnsList() {
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(TestFixtures.testProperty());
        when(propertyRepository.findAll()).thenReturn(List.of(pd));

        List<PropertyDetails> result = propertyService.getAll();
        assertThat(result).hasSize(1);
    }

    // ── getById ────────────────────────────────────────────────────

    @Test
    @DisplayName("getById — returns PropertyDetails when found")
    void getById_returnsWhenFound() {
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(TestFixtures.testProperty());
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(pd));

        PropertyDetails result = propertyService.getById(1L);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getById — throws RuntimeException when not found")
    void getById_throwsWhenNotFound() {
        when(propertyRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> propertyService.getById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Property not found");
    }

    // ── updateByOwner ──────────────────────────────────────────────

    @Test
    @DisplayName("updateByOwner — succeeds when caller is the owner")
    void updateByOwner_succeeds_whenCallerIsOwner() {
        Property prop = TestFixtures.testProperty(); // ownerId = 1
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(pd));
        when(propertyRepository.update(eq(1L), any())).thenReturn(1);

        UpdatePropertyRequest req = UpdatePropertyRequest.builder().title("Updated Title").build();
        propertyService.updateByOwner(1L, req, 1);

        verify(propertyRepository).update(eq(1L), any());
    }

    @Test
    @DisplayName("updateByOwner — throws when caller is not the owner")
    void updateByOwner_throws_whenNotOwner() {
        Property prop = TestFixtures.testProperty(); // ownerId = 1
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(pd));

        UpdatePropertyRequest req = UpdatePropertyRequest.builder().title("Hijack").build();
        assertThatThrownBy(() -> propertyService.updateByOwner(1L, req, 99))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("do not have permission");
    }

    @Test
    @DisplayName("update — throws when null payload")
    void update_throws_whenNullPayload() {
        assertThatThrownBy(() -> propertyService.update(1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("payload is required");
    }

    @Test
    @DisplayName("update — throws RuntimeException when no rows updated (not found)")
    void update_throws_whenNotFound() {
        when(propertyRepository.update(eq(999L), any())).thenReturn(0);
        UpdatePropertyRequest req = UpdatePropertyRequest.builder().title("X").build();
        assertThatThrownBy(() -> propertyService.update(999L, req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Property not found");
    }

    // ── deleteByOwner ──────────────────────────────────────────────

    @Test
    @DisplayName("deleteByOwner — succeeds when caller is the owner")
    void deleteByOwner_succeeds_whenCallerIsOwner() {
        Property prop = TestFixtures.testProperty(); // ownerId = 1
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(pd));
        when(propertyRepository.delete(1L)).thenReturn(1);

        propertyService.deleteByOwner(1L, 1);
        verify(propertyRepository).delete(1L);
    }

    @Test
    @DisplayName("deleteByOwner — throws when caller is not the owner")
    void deleteByOwner_throws_whenNotOwner() {
        Property prop = TestFixtures.testProperty(); // ownerId = 1
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(pd));

        assertThatThrownBy(() -> propertyService.deleteByOwner(1L, 42))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("do not have permission");
    }

    // ── addImageByOwner ────────────────────────────────────────────

    @Test
    @DisplayName("addImageByOwner — allows owner to add image")
    void addImageByOwner_allowsOwner() {
        Property prop = TestFixtures.testProperty(); // ownerId = 1
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(pd));

        propertyService.addImageByOwner(1L, "https://img.url/a.jpg", false, 1);
        verify(propertyRepository).saveImage(1L, "https://img.url/a.jpg", false);
    }

    @Test
    @DisplayName("addImageByOwner — throws when non-owner tries")
    void addImageByOwner_throwsWhenNotOwner() {
        Property prop = TestFixtures.testProperty(); // ownerId = 1
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(pd));

        assertThatThrownBy(() -> propertyService.addImageByOwner(1L, "img.jpg", false, 77))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("do not have permission");
    }

    // ── searchByPrefix ─────────────────────────────────────────────

    @Test
    @DisplayName("searchByPrefix — trims whitespace before querying")
    void searchByPrefix_trimsInput() {
        when(propertyRepository.searchByPrefix("villa")).thenReturn(List.of());
        propertyService.searchByPrefix("  villa  ");
        verify(propertyRepository).searchByPrefix("villa");
    }
}
