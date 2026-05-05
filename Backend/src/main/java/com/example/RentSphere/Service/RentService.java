package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Repository.RentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RentService {

    private final RentRepository rentRepository;
    private final PropertyService propertyService;

    public RentalRequest createRentalRequest(CreateRentalRequest request, int tenantId) {
        return rentRepository.createRentalRequest(request, tenantId);
    }

    public List<RentalRequest> getAllRentalRequests() {
        return rentRepository.findAll();
    }

    public RentalRequest getById(Long id) {
        return rentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rental request not found"));
    }

    public RentalRequest acceptRequest(Long id, int currentUserId) {
        RentalRequest request = getById(id);
        if (!"PENDING".equalsIgnoreCase(request.getReqStatus())) {
            throw new IllegalArgumentException("Only pending rental requests can be accepted");
        }

        PropertyDetails propertyDetails = propertyService.getById(request.getPropertyId());
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new IllegalArgumentException("Property for this request no longer exists");
        }
        if (propertyDetails.getProperty().getOwnerId() == null || propertyDetails.getProperty().getOwnerId().intValue() != currentUserId) {
            throw new IllegalArgumentException("Only the property owner can accept this rental request");
        }

        int updated = rentRepository.updateStatus(id, "ACCEPTED");
        if (updated == 0) {
            throw new RuntimeException("Unable to accept rental request");
        }
        return getById(id);
    }

    public RentalRequest rejectRequest(Long id, int currentUserId) {
        RentalRequest request = getById(id);
        if (!"PENDING".equalsIgnoreCase(request.getReqStatus())) {
            throw new IllegalArgumentException("Only pending rental requests can be rejected");
        }

        PropertyDetails propertyDetails = propertyService.getById(request.getPropertyId());
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new IllegalArgumentException("Property for this request no longer exists");
        }
        if (propertyDetails.getProperty().getOwnerId() == null || propertyDetails.getProperty().getOwnerId().intValue() != currentUserId) {
            throw new IllegalArgumentException("Only the property owner can reject this rental request");
        }

        int updated = rentRepository.updateStatus(id, "REJECTED");
        if (updated == 0) {
            throw new RuntimeException("Unable to reject rental request");
        }
        return getById(id);
    }
}
