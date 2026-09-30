package com.example.RentSphere.Repository;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.PaymentDto;
import com.example.RentSphere.Dto.PaymentDueInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.RowCallbackHandler;

@Repository
@RequiredArgsConstructor
public class ContractRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Contract> contractMapper = (ResultSet rs, int rowNum) -> Contract.builder()
            .contractId(rs.getLong("contract_id"))
            .rentalRequestId(rs.getLong("rental_request_id"))
            .propertyId(rs.getLong("property_id"))
            .ownerId(rs.getLong("owner_id"))
            .tenantId(rs.getLong("tenant_id"))
            .contractStatus(rs.getString("contract_status"))
            .rentAmount(rs.getBigDecimal("rent_amount"))
            .durationMonths(rs.getInt("duration_months"))
            .startDate(rs.getDate("start_date").toLocalDate())
            .endDate(rs.getDate("end_date").toLocalDate())
            .pdfUrl(rs.getString("pdf_url"))
            .notes(rs.getString("notes"))
            .createdAt(getLocalDateTime(rs, "created_at"))
            .updatedAt(getLocalDateTime(rs, "updated_at"))
            .build();

    private final RowMapper<PaymentDto> paymentMapper = (ResultSet rs, int rowNum) -> PaymentDto.builder()
            .paymentId(rs.getLong("payment_id"))
            .contractId(rs.getLong("contract_id"))
            .paymentStatus(rs.getString("payment_status"))
            .installmentNo(rs.getInt("installment_no"))
            .dueDate(rs.getDate("due_date").toLocalDate())
            .paidDate(getLocalDateTime(rs, "paid_date"))
            .amountDue(rs.getBigDecimal("amount_due"))
            .amountPaid(rs.getBigDecimal("amount_paid"))
            .transactionRef(rs.getString("transaction_ref"))
            .notes(rs.getString("notes"))
            .createdAt(getLocalDateTime(rs, "created_at"))
            .updatedAt(getLocalDateTime(rs, "updated_at"))
            .build();

    private final RowMapper<PaymentDueInfo> paymentDueInfoMapper = (ResultSet rs, int rowNum) -> PaymentDueInfo.builder()
            .paymentId(rs.getLong("payment_id"))
            .contractId(rs.getLong("contract_id"))
            .tenantId(rs.getInt("tenant_id"))
            .installmentNo(rs.getInt("installment_no"))
            .dueDate(rs.getDate("due_date").toLocalDate())
            .amountDue(rs.getBigDecimal("amount_due"))
            .build();

    public List<Contract> findAll(String status, int limit, int offset) {
        List<Object> params = new ArrayList<>();
        String sql = "SELECT * FROM contracts";
        if (status != null && !status.isBlank()) {
            sql += " WHERE contract_status = ?";
            params.add(status.trim().toUpperCase());
        }
        sql += " ORDER BY created_at DESC, contract_id DESC LIMIT ? OFFSET ?";
        params.add(limit);
        params.add(offset);
        return jdbcTemplate.query(sql, contractMapper, params.toArray());
    }

    public int countContracts(String status) {
        if (status == null || status.isBlank()) {
            Integer total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM contracts", Integer.class);
            return total == null ? 0 : total;
        }
        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM contracts WHERE contract_status = ?",
                new Object[]{status.trim().toUpperCase()}, Integer.class);
        return total == null ? 0 : total;
    }

    public Map<String, Integer> countContractsByStatus() {
        Map<String, Integer> counts = new HashMap<>();
        // Explicit RowCallbackHandler: a bare lambda here would bind to ResultSetExtractor, whose
        // cursor sits before the first row, and reading it throws "No data is available".
        jdbcTemplate.query("SELECT contract_status, COUNT(*) AS c FROM contracts GROUP BY contract_status",
                (RowCallbackHandler) rs -> counts.put(rs.getString("contract_status"), rs.getInt("c")));
        return counts;
    }

    public List<Contract> findByTenantId(Long tenantId) {
        String sql = "SELECT * FROM contracts WHERE tenant_id = ? ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, new Object[]{tenantId}, contractMapper);
    }

    public List<Contract> findByOwnerId(Long ownerId) {
        String sql = "SELECT * FROM contracts WHERE owner_id = ? ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, new Object[]{ownerId}, contractMapper);
    }

    public List<PaymentDto> findPaymentsByContractId(Long contractId) {
        String sql = "SELECT * FROM payments WHERE contract_id = ? ORDER BY installment_no ASC";
        return jdbcTemplate.query(sql, new Object[]{contractId}, paymentMapper);
    }

    public List<PaymentDueInfo> findPaymentsDueOn(LocalDate dueDate) {
        String sql = "SELECT p.payment_id, p.contract_id, c.tenant_id, p.installment_no, p.due_date, p.amount_due " +
                "FROM payments p JOIN contracts c ON p.contract_id = c.contract_id " +
                "WHERE p.due_date = ? AND p.payment_status = 'PENDING' AND c.contract_status = 'ACTIVE'";
        return jdbcTemplate.query(sql, new Object[]{Date.valueOf(dueDate)}, paymentDueInfoMapper);
    }

    public List<Contract> findActiveContractsWithPastDuePendingPayments(LocalDate today) {
        String sql = "SELECT DISTINCT c.* FROM contracts c " +
                "JOIN payments p ON p.contract_id = c.contract_id " +
                "WHERE c.contract_status = 'ACTIVE' AND p.payment_status = 'PENDING' AND p.due_date < ?";
        return jdbcTemplate.query(sql, new Object[]{Date.valueOf(today)}, contractMapper);
    }

    public List<Contract> findActiveContractsToComplete(LocalDate today) {
        String sql = "SELECT c.* FROM contracts c " +
                "WHERE c.contract_status = 'ACTIVE' AND c.end_date < ? " +
                "AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.contract_id = c.contract_id AND p.payment_status IN ('PENDING', 'OVERDUE'))";
        return jdbcTemplate.query(sql, new Object[]{Date.valueOf(today)}, contractMapper);
    }

    public int markPaymentsOverdueByContract(Long contractId) {
        String sql = "UPDATE payments SET payment_status = 'OVERDUE', updated_at = NOW() " +
                "WHERE contract_id = ? AND payment_status = 'PENDING' AND due_date < CURRENT_DATE";
        return jdbcTemplate.update(sql, contractId);
    }

    public int cancelContract(Long contractId) {
        // A COMPLETED or already CANCELLED contract must not be reopened by the overdue sweep.
        String sql = "UPDATE contracts SET contract_status = 'CANCELLED', updated_at = NOW() " +
                "WHERE contract_id = ? AND contract_status IN ('ACTIVE', 'PENDING')";
        return jdbcTemplate.update(sql, contractId);
    }

    public Contract createContract(Contract contract) {
        String sql = "INSERT INTO contracts (rental_request_id, property_id, owner_id, tenant_id, contract_status, rent_amount, duration_months, start_date, end_date, pdf_url, notes) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"contract_id"});
            ps.setLong(1, contract.getRentalRequestId());
            ps.setLong(2, contract.getPropertyId());
            ps.setLong(3, contract.getOwnerId());
            ps.setLong(4, contract.getTenantId());
            ps.setString(5, contract.getContractStatus());
            ps.setBigDecimal(6, contract.getRentAmount());
            ps.setInt(7, contract.getDurationMonths());
            ps.setDate(8, Date.valueOf(contract.getStartDate()));
            ps.setDate(9, Date.valueOf(contract.getEndDate()));
            ps.setString(10, contract.getPdfUrl());
            ps.setString(11, contract.getNotes());
            return ps;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        if (generatedKey == null) {
            throw new RuntimeException("Failed to create contract");
        }
        return findById(generatedKey.longValue())
                .orElseThrow(() -> new RuntimeException("Failed to load created contract"));
    }

    public Optional<Contract> findById(Long id) {
        String sql = "SELECT * FROM contracts WHERE contract_id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, new Object[]{id}, contractMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void createPaymentSchedule(Long contractId, BigDecimal amount, int durationMonths, LocalDate startDate) {
        String sql = "INSERT INTO payments (contract_id, payment_status, installment_no, due_date, paid_date, amount_due, amount_paid, transaction_ref, notes) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        java.time.LocalDateTime now = LocalDateTime.now();
        for (int installment = 1; installment <= durationMonths; installment++) {
            LocalDate dueDate = startDate.plusMonths(installment - 1);
            jdbcTemplate.update(sql,
                    contractId,
                    "PENDING",
                    installment,
                    Date.valueOf(dueDate),
                    null, 
                    amount,
                    BigDecimal.ZERO,
                    null,
                    null);
        }
    }

    // Overdue installments stay payable, so both statuses count as outstanding.
    public Optional<PaymentDto> findNextPendingPayment(Long contractId) {
        String sql = "SELECT * FROM payments WHERE contract_id = ? AND payment_status IN ('PENDING', 'OVERDUE') ORDER BY installment_no LIMIT 1";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, new Object[]{contractId}, paymentMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<PaymentDto> findPendingPaymentByInstallmentNo(Long contractId, int installmentNo) {
        String sql = "SELECT * FROM payments WHERE contract_id = ? AND installment_no = ? AND payment_status IN ('PENDING', 'OVERDUE')";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, new Object[]{contractId, installmentNo}, paymentMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    // Only an unsettled installment can be paid; never overwrite REFUNDED / WAIVED / PAID.
    public int markPaymentPaid(Long contractId, int installmentNo, BigDecimal amountPaid, String transactionRef) {
        String sql = "UPDATE payments SET payment_status = 'PAID', amount_paid = ?, transaction_ref = ?, paid_date = NOW(), updated_at = NOW() " +
                "WHERE contract_id = ? AND installment_no = ? AND payment_status IN ('PENDING', 'OVERDUE')";
        return jdbcTemplate.update(sql, amountPaid, transactionRef, contractId, installmentNo);
    }

    public int countPendingPayments(Long contractId) {
        String sql = "SELECT COUNT(*) FROM payments WHERE contract_id = ? AND payment_status = 'PENDING'";
        return jdbcTemplate.queryForObject(sql, new Object[]{contractId}, Integer.class);
    }

    public int countContractsByStatus(String status) {
        String sql = "SELECT COUNT(*) FROM contracts WHERE contract_status = ?";
        Integer count = jdbcTemplate.queryForObject(sql, new Object[]{status}, Integer.class);
        return count == null ? 0 : count;
    }

    // A contract is only finished once nothing is still owed; OVERDUE rows count too.
    public int countUnsettledPayments(Long contractId) {
        String sql = "SELECT COUNT(*) FROM payments WHERE contract_id = ? AND payment_status IN ('PENDING', 'OVERDUE')";
        return jdbcTemplate.queryForObject(sql, new Object[]{contractId}, Integer.class);
    }

    public int completeContract(Long contractId) {
        String sql = "UPDATE contracts SET contract_status = 'COMPLETED', updated_at = NOW() " +
                "WHERE contract_id = ? AND contract_status = 'ACTIVE'";
        return jdbcTemplate.update(sql, contractId);
    }

    private static LocalDateTime getLocalDateTime(ResultSet rs, String columnName) throws java.sql.SQLException {
        Timestamp timestamp = rs.getTimestamp(columnName);
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
