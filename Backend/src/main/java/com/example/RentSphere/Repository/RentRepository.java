package com.example.RentSphere.Repository;

import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.RentalRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * JDBC data access repository for the {@code rental_requests} table.
 *
 * <p>Manages tenant rental applications, status transitions (PENDING to ACCEPTED/REJECTED),
 * and owner/admin review queues.
 */
@Repository
@RequiredArgsConstructor
public class RentRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<RentalRequest> rentalRequestMapper = (ResultSet rs, int rowNum) -> RentalRequest.builder()
            .rentalReqId(rs.getLong("rental_req_id"))
            .propertyId(rs.getLong("property_id"))
            .tenantId(rs.getLong("tenant_id"))
            .message(rs.getString("message"))
            .desiredStart(rs.getDate("desired_start").toLocalDate())
            .desiredMonths(rs.getInt("desired_months"))
            .reqStatus(rs.getString("req_status"))
            .reviewedAt(getLocalDateTime(rs, "reviewed_at"))
            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
            .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime())
            .build();

    public RentalRequest createRentalRequest(CreateRentalRequest request, int tenantId) {
        if (request.getDesiredMonths() == null || request.getDesiredMonths() < 1) {
            request.setDesiredMonths(1);
        }

        String sql = "INSERT INTO rental_requests (property_id, tenant_id, message, desired_start, desired_months, req_status) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"rental_req_id"});
            ps.setLong(1, request.getPropertyId());
            ps.setInt(2, tenantId);
            ps.setString(3, request.getMessage());
            ps.setDate(4, Date.valueOf(request.getDesiredStart()));
            ps.setInt(5, request.getDesiredMonths());
            ps.setString(6, "PENDING");
            return ps;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        if (generatedKey == null) {
            throw new RuntimeException("Failed to create rental request");
        }
        return findById(generatedKey.longValue())
                .orElseThrow(() -> new RuntimeException("Failed to read new rental request"));
    }

    public List<RentalRequest> findAll(String status, int limit, int offset) {
        List<Object> params = new ArrayList<>();
        String sql = "SELECT * FROM rental_requests";
        if (status != null && !status.isBlank()) {
            sql += " WHERE req_status = ?";
            params.add(status.trim().toUpperCase());
        }
        sql += " ORDER BY created_at DESC, rental_req_id DESC LIMIT ? OFFSET ?";
        params.add(limit);
        params.add(offset);
        return jdbcTemplate.query(sql, rentalRequestMapper, params.toArray());
    }

    public int countRequests(String status) {
        List<Object> params = new ArrayList<>();
        String sql = "SELECT COUNT(*) FROM rental_requests";
        if (status != null && !status.isBlank()) {
            sql += " WHERE req_status = ?";
            params.add(status.trim().toUpperCase());
        }
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, params.toArray());
        return count == null ? 0 : count;
    }

    public Map<String, Integer> countRequestsByStatus() {
        Map<String, Integer> counts = new HashMap<>();
        // Explicit RowCallbackHandler: a bare lambda here would bind to ResultSetExtractor, whose
        // cursor sits before the first row, and reading it throws "No data is available".
        jdbcTemplate.query(
                "SELECT req_status, COUNT(*) AS c FROM rental_requests GROUP BY req_status",
                (RowCallbackHandler) rs -> counts.put(rs.getString("req_status"), rs.getInt("c")));
        return counts;
    }

    public Optional<RentalRequest> findById(Long id) {
        String sql = "SELECT * FROM rental_requests WHERE rental_req_id = ?";
        try {
            RentalRequest request = jdbcTemplate.queryForObject(sql, new Object[]{id}, rentalRequestMapper);
            return Optional.ofNullable(request);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public int updateStatus(Long id, String status) {
        String sql = "UPDATE rental_requests SET req_status = ?, reviewed_at = NOW() WHERE rental_req_id = ? AND req_status = 'PENDING'";
        return jdbcTemplate.update(sql, status, id);
    }

    private static java.time.LocalDateTime getLocalDateTime(ResultSet rs, String columnName) throws java.sql.SQLException {
        Timestamp timestamp = rs.getTimestamp(columnName);
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
