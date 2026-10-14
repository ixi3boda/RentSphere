package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Exception.BadRequestException;
import com.example.RentSphere.Exception.ResourceNotFoundException;
import com.example.RentSphere.Repository.RentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Business-logic layer for rental request management.
 *
 * <p>A rental request is a tenant's expression of interest in a listing. The lifecycle
 * is: {@code PENDING} → {@code ACCEPTED} or {@code REJECTED} (by the property owner),
 * with the scheduler able to move PENDING requests to {@code CANCELLED} on overdue
 * payments after a contract is created.
 *
 * <p>On acceptance, this service delegates to {@link ContractService} to create the
 * contract and the monthly payment schedule in the same transaction, and to
 * {@link NotificationService} to inform the tenant. All notifications are deduplicated
 * by {@code (recipient, type, title)} so re-running the same flow is safe.
 *
 * <p>Ownership rules: only the property owner may accept or reject a request, and only
 * while the request is still {@code PENDING}. These checks are enforced here rather
 * than in the controller to keep HTTP concerns out of the business layer.
 */
@Service
@RequiredArgsConstructor
public class RentService {

    private static final int MAX_PENDING_REQUESTS_PER_TENANT = 10;

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
        LocalDate today = LocalDate.now();
        if (request.getDesiredStart().isBefore(today) || request.getDesiredStart().isAfter(today.plusYears(1))) {
            throw new IllegalArgumentException("Desired start date must be within the next 12 months");
        }

        PropertyDetails property = propertyService.getById(request.getPropertyId());
        if (property.getProperty().getOwnerId() != null && property.getProperty().getOwnerId() == tenantId) {
            throw new IllegalArgumentException("You cannot request your own property");
        }
        if (Boolean.FALSE.equals(property.getProperty().getIsAvailable())) {
            throw new IllegalArgumentException("This property is not available for rent");
        }
        if (rentRepository.existsPendingByTenantAndProperty(tenantId, request.getPropertyId())) {
            throw new IllegalArgumentException("You already have a pending request for this property");
        }
        if (rentRepository.countPendingByTenant(tenantId) >= MAX_PENDING_REQUESTS_PER_TENANT) {
            throw new IllegalArgumentException("You have too many pending requests; wait for the owners to answer");
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

    public List<RentalRequest> getRentalRequests(int ownerId, String status, int limit, int offset) {
        return rentRepository.findAllForOwner(ownerId, status, limit, offset);
    }

    public int countRentalRequests(int ownerId, String status) {
        return rentRepository.countRequestsForOwner(ownerId, status);
    }

    public Map<String, Integer> requestStatusCounts(int ownerId) {
        return rentRepository.countRequestsByStatusForOwner(ownerId);
    }

    public RentalRequest getById(Long id) {
        return rentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rental request not found"));
    }

    /**
     * A request carries the applicant's message and dates, so only the tenant who filed it or
     * the landlord who would answer it may read it.
     */
    public RentalRequest getByIdForActor(Long id, int actorUserId) {
        RentalRequest request = getById(id);
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
        // One listing, one lease: a second accept would create two active contracts on it.
        if (Boolean.FALSE.equals(propertyDetails.getProperty().getIsAvailable())) {
            throw new BadRequestException("This property is already leased; reject the request instead");
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

        Contract contract = contractService.createContractForApprovedRequest(request, propertyDetails);
        propertyService.setAvailability(request.getPropertyId(), false);
        return contract;
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
