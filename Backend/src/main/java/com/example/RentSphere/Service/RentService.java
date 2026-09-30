package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Exception.ResourceNotFoundException;
import com.example.RentSphere.Repository.RentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RentService {

    private final RentRepository rentRepository;
    private final PropertyService propertyService;
    private final ContractService contractService;
    private final NotificationService notificationService;

    public RentalRequest createRentalRequest(CreateRentalRequest request, int tenantId) {
        if (request == null) {
            throw new IllegalArgumentException("Rental request payload is required");
        }
        if (request.getPropertyId() == null) {
            throw new IllegalArgumentException("Property ID is required");
        }
        if (request.getDesiredStart() == null) {
            throw new IllegalArgumentException("Desired start date is required");
        }
        if (request.getDesiredMonths() != null && (request.getDesiredMonths() < 1 || request.getDesiredMonths() > 24)) {
            throw new IllegalArgumentException("Desired months must be between 1 and 24");
        }
        RentalRequest created = rentRepository.createRentalRequest(request, tenantId);
        notifyOwnerOfNewRequest(created);
        return created;
    }

    // Notification titles are deduplicated per recipient, so the request id has to be in the title
    // or an owner would only ever see the first request against their account.
    private void notifyOwnerOfNewRequest(RentalRequest request) {
        PropertyDetails property = propertyService.getById(request.getPropertyId());
        if (property == null || property.getProperty() == null || property.getProperty().getOwnerId() == null) {
            return;
        }
        int ownerId = property.getProperty().getOwnerId().intValue();
        int months = request.getDesiredMonths() == null || request.getDesiredMonths() < 1 ? 1 : request.getDesiredMonths();
        notificationService.createNotification(
                ownerId,
                "NEW_REQUEST",
                "New request #" + request.getRentalReqId() + " for property #" + request.getPropertyId(),
                String.format("A tenant requested this property for %d months starting %s.", months, request.getDesiredStart())
        );
    }

    public List<RentalRequest> getRentalRequests(String status, int limit, int offset) {
        return rentRepository.findAll(status, limit, offset);
    }

    public int countRentalRequests(String status) {
        return rentRepository.countRequests(status);
    }

    public Map<String, Integer> requestStatusCounts() {
        return rentRepository.countRequestsByStatus();
    }

    public RentalRequest getById(Long id) {
        return rentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rental request not found"));
    }

    /**
     * A request carries the applicant's message and dates, so only the tenant who filed it, the
     * landlord who would answer it, or an administrator may read it.
     */
    public RentalRequest getByIdForActor(Long id, int actorUserId, boolean actorIsAdmin) {
        RentalRequest request = getById(id);
        if (actorIsAdmin) {
            return request;
        }
        long actor = actorUserId;
        if (request.getTenantId() != null && request.getTenantId() == actor) {
            return request;
        }
        PropertyDetails property = propertyService.getById(request.getPropertyId());
        boolean isPropertyOwner = property != null && property.getProperty() != null
                && property.getProperty().getOwnerId() != null
                && property.getProperty().getOwnerId() == actor;
        if (!isPropertyOwner) {
            throw new AccessDeniedException("Rental request #" + id + " does not belong to the authenticated user");
        }
        return request;
    }

    @Transactional
    public Contract acceptRequest(Long id, int currentUserId) {
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

        notificationService.createNotification(
                request.getTenantId().intValue(),
                "REQUEST_ACCEPTED",
                "Rental request #" + id + " accepted",
                "Your request was accepted and the rental contract is now active."
        );

        return contractService.createContractForApprovedRequest(request, propertyDetails);
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

        notificationService.createNotification(
                request.getTenantId().intValue(),
                "REQUEST_REJECTED",
                "Rental request #" + id + " rejected",
                "The owner of this property declined your rental request."
        );

        return getById(id);
    }
}
