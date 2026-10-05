package com.example.RentSphere.Repository;

import com.example.RentSphere.Dto.CreatePropertyRequest;
import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.Property;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.UpdatePropertyRequest;
import com.example.RentSphere.Dto.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PropertyRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Property> mapper = (ResultSet rs, int rowNum) -> {
        Property p = new Property();

        p.setPropertyId(rs.getLong("property_id"));
        p.setOwnerId(rs.getLong("owner_id"));
        p.setPropertyType(rs.getString("property_type"));
        p.setTitle(rs.getString("title"));
        p.setPropertyDescription(rs.getString("property_description"));
        p.setPricePerMonth(rs.getBigDecimal("price_per_month"));
        p.setCity(rs.getString("city"));
        p.setDistrict(rs.getString("district"));
        p.setAddress(rs.getString("address"));
        p.setLatitude(rs.getBigDecimal("latitude"));
        p.setLongitude(rs.getBigDecimal("longitude"));
        p.setNumRooms(rs.getInt("num_rooms"));
        p.setAreaSqm(rs.getBigDecimal("area_sqm"));
        p.setIsAvailable(rs.getBoolean("is_available"));
        p.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        p.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());

        return p;
    };

    // Pre-batching implementation: two queries per property. No production caller uses it any more,
    // but Performance/README.md reproduces the "before" half of its benchmark by pointing the list
    // builders at this method, so it stays.
    private PropertyDetails buildPropertyDetails(Property property) {

        Long propertyId = property.getPropertyId();

        String coverSql = """
        SELECT image_url 
        FROM property_images 
        WHERE property_id = ? AND is_cover = TRUE
        LIMIT 1
    """;

        String coverPic = jdbcTemplate.query(
                coverSql,
                (rs, rowNum) -> rs.getString("image_url"),
                propertyId
        ).stream().findFirst().orElse(null);

        String imageSql = """
        SELECT image_url 
        FROM property_images 
        WHERE property_id = ?
    """;

        List<String> images = jdbcTemplate.query(
                imageSql,
                (rs, rowNum) -> rs.getString("image_url"),
                propertyId
        );

        return new PropertyDetails(property, images, coverPic);
    }

    private List<PropertyDetails> buildPropertyDetailsBatch(List<Property> properties) {

        List<Long> ids = properties.stream().map(Property::getPropertyId).toList();
        Map<Long, List<String>> imagesById = new LinkedHashMap<>();
        Map<Long, String> coverById = new LinkedHashMap<>();

        final int chunkSize = 500;
        for (int i = 0; i < ids.size(); i += chunkSize) {
            List<Long> slice = ids.subList(i, Math.min(i + chunkSize, ids.size()));
            String placeholders = String.join(",", Collections.nCopies(slice.size(), "?"));
            String sql = "SELECT property_id, image_url, is_cover FROM property_images WHERE property_id IN (" + placeholders + ")";

            jdbcTemplate.query(sql, (ResultSet rs) -> {
                while (rs.next()) {
                    long pid = rs.getLong("property_id");
                    String url = rs.getString("image_url");
                    imagesById.computeIfAbsent(pid, k -> new ArrayList<>()).add(url);
                    if (rs.getBoolean("is_cover")) {
                        coverById.putIfAbsent(pid, url);
                    }
                }
                return null;
            }, slice.toArray());
        }

        return properties.stream()
                .map(p -> new PropertyDetails(
                        p,
                        imagesById.getOrDefault(p.getPropertyId(), List.of()),
                        coverById.get(p.getPropertyId())))
                .toList();
    }

    public int saveImage(Long property_id, String image_url, boolean is_cover) {
        String sql = """
        INSERT INTO property_images (property_id, image_url, is_cover)
        VALUES (?, ?, ?)
    """;

        return jdbcTemplate.update(sql, property_id, image_url, is_cover);
    }

    public PropertyDetails addProperty(CreatePropertyRequest request, int user_id) {

        String insertSql = """
        INSERT INTO properties
        (owner_id, property_type, title, property_description,
         price_per_month, city, district, address,
         latitude, longitude, num_rooms, area_sqm, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """;

        jdbcTemplate.update(insertSql,
                user_id,
                request.getPropertyType(),
                request.getTitle(),
                request.getPropertyDescription(),
                request.getPricePerMonth(),
                request.getCity(),
                request.getDistrict(),
                request.getAddress(),
                request.getLatitude(),
                request.getLongitude(),
                request.getNumRooms(),
                request.getAreaSqm(),
                request.getIsAvailable() == null ? true : request.getIsAvailable()
        );

        Long propertyId = jdbcTemplate.queryForObject(
                "SELECT LAST_INSERT_ID()",
                Long.class
        );

        if (propertyId == null) {
            throw new RuntimeException("Property creation failed");
        }

        if (request.getCoverPic() != null && !request.getCoverPic().isBlank()) {
            saveImage(propertyId, request.getCoverPic(), true);
        }

        return findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property creation failed"));
    }

    public List<PropertyDetails> findByOwnerId(int ownerId) {

        String sql = "SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC";

        return buildPropertyDetailsBatch(jdbcTemplate.query(sql, mapper, ownerId));
    }

    public int countAll() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM properties", Integer.class);
        return count == null ? 0 : count;
    }

    public List<String> findDistinctCities() {
        String sql = "SELECT DISTINCT city FROM properties WHERE city IS NOT NULL AND city <> '' ORDER BY city";
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("city"));
    }

    public int countAvailable() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM properties WHERE is_available = TRUE", Integer.class);
        return count == null ? 0 : count;
    }
    public Optional<PropertyDetails> findById(Long id) {

        String propertySql = "SELECT * FROM properties WHERE property_id = ?";
        List<Property> propertyResult = jdbcTemplate.query(propertySql, mapper, id);

        Optional<Property> propertyOpt = propertyResult.stream().findFirst();

        if (propertyOpt.isEmpty()) {
            return Optional.empty();
        }

        String coverSql = """
        SELECT image_url 
        FROM property_images 
        WHERE property_id = ? AND is_cover = TRUE
        LIMIT 1
        """;

        String coverPic = jdbcTemplate.query(
                coverSql,
                (rs, rowNum) -> rs.getString("image_url"),
                id
        ).stream().findFirst().orElse(null);

        String imageSql = "SELECT image_url FROM property_images WHERE property_id = ?";
        List<String> images = jdbcTemplate.query(
                imageSql,
                (rs, rowNum) -> rs.getString("image_url"),
                id
        );

        PropertyDetails details = new PropertyDetails(
                propertyOpt.get(),
                images,
                coverPic
        );

        return Optional.of(details);
    }

    public int update(Long property_id, UpdatePropertyRequest request) {

        StringBuilder sql = new StringBuilder("UPDATE properties SET ");
        List<Object> params = new ArrayList<>();

        if (request.getPropertyType() != null) {
            sql.append("property_type = ?, ");
            params.add(request.getPropertyType());
        }

        if (request.getTitle() != null) {
            sql.append("title = ?, ");
            params.add(request.getTitle());
        }

        if (request.getPropertyDescription() != null) {
            sql.append("property_description = ?, ");
            params.add(request.getPropertyDescription());
        }

        if (request.getPricePerMonth() != null) {
            sql.append("price_per_month = ?, ");
            params.add(request.getPricePerMonth());
        }

        if (request.getCity() != null) {
            sql.append("city = ?, ");
            params.add(request.getCity());
        }

        if (request.getDistrict() != null) {
            sql.append("district = ?, ");
            params.add(request.getDistrict());
        }

        if (request.getAddress() != null) {
            sql.append("address = ?, ");
            params.add(request.getAddress());
        }

        if (request.getLatitude() != null) {
            sql.append("latitude = ?, ");
            params.add(request.getLatitude());
        }

        if (request.getLongitude() != null) {
            sql.append("longitude = ?, ");
            params.add(request.getLongitude());
        }

        if (request.getNumRooms() != null) {
            sql.append("num_rooms = ?, ");
            params.add(request.getNumRooms());
        }

        if (request.getAreaSqm() != null) {
            sql.append("area_sqm = ?, ");
            params.add(request.getAreaSqm());
        }

        if (request.getIsAvailable() != null) {
            sql.append("is_available = ?, ");
            params.add(request.getIsAvailable());
        }

        if (params.isEmpty()) {
            throw new RuntimeException("No fields to update");
        }

        sql.setLength(sql.length() - 2);
        sql.append(", updated_at = CURRENT_TIMESTAMP WHERE property_id = ?");
        params.add(property_id);

        return jdbcTemplate.update(sql.toString(), params.toArray());
    }

    public int delete(Long id) {
        return jdbcTemplate.update("DELETE FROM properties WHERE property_id = ?", id);
    }

    public record PropertyFilter(
            String search,
            String city,
            String district,
            String propertyType,
            Double minPrice,
            Double maxPrice,
            Integer numRooms,
            Boolean isAvailable
    ) {}

    // Sort keys are resolved through this whitelist so a request can never reach ORDER BY as raw SQL.
    private static final Map<String, String> FILTER_ORDERS = Map.of(
            "newest", "created_at DESC, property_id DESC",
            "price_asc", "price_per_month ASC, property_id ASC",
            "price_desc", "price_per_month DESC, property_id DESC"
    );

    private volatile Boolean fullTextSupported = null;

    private boolean isFullTextSupported() {
        if (fullTextSupported == null) {
            synchronized (this) {
                if (fullTextSupported == null) {
                    try {
                        if (jdbcTemplate.getDataSource() != null) {
                            try (var conn = jdbcTemplate.getDataSource().getConnection()) {
                                String dbName = conn.getMetaData().getDatabaseProductName();
                                fullTextSupported = dbName != null && (dbName.toLowerCase().contains("mysql") || dbName.toLowerCase().contains("mariadb"));
                            }
                        } else {
                            fullTextSupported = false;
                        }
                    } catch (Exception e) {
                        fullTextSupported = false;
                    }
                }
            }
        }
        return fullTextSupported;
    }

    private String buildFilterWhere(PropertyFilter filter, List<Object> params) {
        StringBuilder sql = new StringBuilder(" WHERE 1=1 ");

        if (filter.search() != null && !filter.search().isBlank()) {
            String term = filter.search().trim();
            // FULLTEXT MATCH..AGAINST uses idx_properties_fulltext and avoids the full-table scan
            // that LIKE '%term%' caused. MySQL's minimum token length is 2 chars by default; for
            // single-character inputs or test environments (e.g. H2) we fall back to LIKE so short queries still work.
            if (isFullTextSupported() && term.length() >= 2) {
                sql.append(" AND MATCH(title, city, district, property_description) AGAINST (? IN BOOLEAN MODE) ");
                params.add("+" + term + "*");
            } else {
                sql.append(" AND (LOWER(title) LIKE ? OR LOWER(city) LIKE ? OR LOWER(district) LIKE ?) ");
                String like = "%" + term.toLowerCase() + "%";
                params.add(like);
                params.add(like);
                params.add(like);
            }
        }

        if (filter.city() != null && !filter.city().isBlank()) {
            sql.append(" AND city = ? ");
            params.add(filter.city());
        }

        if (filter.district() != null && !filter.district().isBlank()) {
            sql.append(" AND district = ? ");
            params.add(filter.district());
        }

        // chk_type stores property_type uppercased, while clients send the lowercase option value.
        if (filter.propertyType() != null && !filter.propertyType().isBlank()) {
            sql.append(" AND property_type = ? ");
            params.add(filter.propertyType().trim().toUpperCase());
        }

        if (filter.minPrice() != null) {
            sql.append(" AND price_per_month >= ? ");
            params.add(filter.minPrice());
        }

        if (filter.maxPrice() != null) {
            sql.append(" AND price_per_month <= ? ");
            params.add(filter.maxPrice());
        }

        if (filter.numRooms() != null) {
            sql.append(" AND num_rooms = ? ");
            params.add(filter.numRooms());
        }

        if (filter.isAvailable() != null) {
            sql.append(" AND is_available = ? ");
            params.add(filter.isAvailable());
        }

        return sql.toString();
    }

    public int countFilterProperties(PropertyFilter filter) {
        List<Object> params = new ArrayList<>();
        String sql = "SELECT COUNT(*) FROM properties" + buildFilterWhere(filter, params);
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, params.toArray());
        return count == null ? 0 : count;
    }

    public List<PropertyDetails> filterProperties(PropertyFilter filter, String sortBy, int limit, int offset) {
        List<Object> params = new ArrayList<>();
        String sql = "SELECT * FROM properties" + buildFilterWhere(filter, params)
                + " ORDER BY " + FILTER_ORDERS.getOrDefault(sortBy, FILTER_ORDERS.get("newest"))
                + " LIMIT ? OFFSET ?";
        params.add(limit);
        params.add(offset);

        return buildPropertyDetailsBatch(jdbcTemplate.query(sql, mapper, params.toArray()));
    }

    public Favorite favorite(int propertyId, int tenantId) {
        
        String checkSql = "SELECT COUNT(*) FROM favorites WHERE tenant_id = ? AND property_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, tenantId, propertyId);
        
        if (count != null && count > 0) {
            
            String deleteSql = "DELETE FROM favorites WHERE tenant_id = ? AND property_id = ?";
            jdbcTemplate.update(deleteSql, tenantId, propertyId);
        } else {
            
            String insertSql = "INSERT INTO favorites (tenant_id, property_id) VALUES (?, ?)";
            int rows = jdbcTemplate.update(insertSql, tenantId, propertyId);
            if (rows == 0) {
                throw new RuntimeException("Failed to add property to favorites");
            }
        }

        RowMapper<User> userMapper = (rs, rowNum) -> {
            User user = new User();
            user.setUser_id(rs.getInt("user_id"));
            user.setFull_name(rs.getString("full_name"));
            user.setEmail(rs.getString("email"));
            user.setUsername(rs.getString("username"));
            user.setPassword_hash(rs.getString("password_hash"));
            user.setMobile_number(rs.getString("mobile_number"));
            user.setAvatar_url(rs.getString("avatar_url"));
            user.set_active(rs.getBoolean("is_active"));
            user.setCreated_at(rs.getTimestamp("created_at").toLocalDateTime());
            user.setUpdated_at(rs.getTimestamp("updated_at").toLocalDateTime());
            return user;
        };

        String userSql = "SELECT * FROM users WHERE user_id = ?";
        User user = jdbcTemplate.query(userSql, userMapper, tenantId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User not found"));

        PropertyDetails propertyDetails = findById((long) propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        return Favorite.builder()
                .user(user)
                .propertyDetails(propertyDetails)
                .build();
    }

    public List<Favorite> getAllFavorites(int tenantId) {

        String userSql = "SELECT * FROM users WHERE user_id = ?";

        RowMapper <User> userMapper = (rs, rowNum) -> {
            User user = new User();

            user.setUser_id(rs.getInt("user_id"));
            user.setFull_name(rs.getString("full_name"));
            user.setEmail(rs.getString("email"));
            user.setUsername(rs.getString("username"));
            user.setPassword_hash(rs.getString("password_hash"));
            user.setMobile_number(rs.getString("mobile_number"));
            user.setAvatar_url(rs.getString("avatar_url"));
            user.set_active(rs.getBoolean("is_active"));
            user.setCreated_at(rs.getTimestamp("created_at").toLocalDateTime());
            user.setUpdated_at(rs.getTimestamp("updated_at").toLocalDateTime());

            return user;
        };

        User user = jdbcTemplate.query(userSql, userMapper, tenantId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User not found"));

        String favoriteSql = """
        SELECT property_id
        FROM favorites
        WHERE tenant_id = ?
        ORDER BY saved_at DESC
    """;

        List <Long> propertyIds = jdbcTemplate.query(
                favoriteSql,
                (rs, rowNum) -> rs.getLong("property_id"),
                tenantId
        );

        List <Favorite> favorites = new ArrayList<>();

        for (Long propertyId : propertyIds) {

            PropertyDetails propertyDetails = findById(propertyId)
                    .orElseThrow(() ->
                            new RuntimeException("Property not found with id: " + propertyId));

            favorites.add(
                    Favorite.builder()
                            .user(user)
                            .propertyDetails(propertyDetails)
                            .build()
            );
        }

        return favorites;
    }

}