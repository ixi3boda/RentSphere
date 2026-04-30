package com.example.RentSphere.Repository;

import com.example.RentSphere.Dto.Favorite;
import com.example.RentSphere.Dto.Property;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
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

    public int saveImage(Long property_id, String image_url, boolean is_cover) {
        String sql = """
        INSERT INTO property_images (property_id, image_url, is_cover)
        VALUES (?, ?, ?)
    """;

        return jdbcTemplate.update(sql, property_id, image_url, is_cover);
    }

    public PropertyDetails addProperty(Property p, int user_id, String coverPic) {

        String insertSql = """
        INSERT INTO properties
        (owner_id, property_type, title, property_description,
         price_per_month, city, district, address,
         latitude, longitude, num_rooms, area_sqm, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """;

        jdbcTemplate.update(insertSql,
                user_id,
                p.getPropertyType(),
                p.getTitle(),
                p.getPropertyDescription(),
                p.getPricePerMonth(),
                p.getCity(),
                p.getDistrict(),
                p.getAddress(),
                p.getLatitude(),
                p.getLongitude(),
                p.getNumRooms(),
                p.getAreaSqm(),
                p.getIsAvailable()
        );

        Long propertyId = jdbcTemplate.queryForObject(
                "SELECT LAST_INSERT_ID()",
                Long.class
        );

        if (coverPic != null && !coverPic.isBlank()) {
            saveImage(propertyId, coverPic, true);
        }

        return findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property creation failed"));
    }

    public List<PropertyDetails> findAll() {

        String sql = "SELECT * FROM properties ORDER BY created_at DESC";

        List<Property> properties = jdbcTemplate.query(sql, mapper);

        return properties.stream()
                .map(this::buildPropertyDetails)
                .toList();
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

    public int update(Property p) {
        String sql = """
            UPDATE properties SET
            property_type=?,
            title=?,
            property_description=?,
            price_per_month=?,
            city=?,
            district=?,
            address=?,
            latitude=?,
            longitude=?,
            num_rooms=?,
            area_sqm=?,
            is_available=?,
            updated_at=CURRENT_TIMESTAMP
            WHERE property_id=?
        """;

        return jdbcTemplate.update(sql,
                p.getPropertyType(),
                p.getTitle(),
                p.getPropertyDescription(),
                p.getPricePerMonth(),
                p.getCity(),
                p.getDistrict(),
                p.getAddress(),
                p.getLatitude(),
                p.getLongitude(),
                p.getNumRooms(),
                p.getAreaSqm(),
                p.getIsAvailable(),
                p.getPropertyId()
        );
    }

    public int delete(Long id) {
        return jdbcTemplate.update("DELETE FROM properties WHERE property_id = ?", id);
    }

    public List<PropertyDetails> filterProperties(
            String city,
            String district,
            Double minPrice,
            Double maxPrice,
            Integer numRooms,
            Boolean isAvailable
    ) {

        StringBuilder sql = new StringBuilder("SELECT * FROM properties WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (city != null && !city.isBlank()) {
            sql.append(" AND city = ? ");
            params.add(city);
        }

        if (district != null && !district.isBlank()) {
            sql.append(" AND district = ? ");
            params.add(district);
        }

        if (minPrice != null) {
            sql.append(" AND price_per_month >= ? ");
            params.add(minPrice);
        }

        if (maxPrice != null) {
            sql.append(" AND price_per_month <= ? ");
            params.add(maxPrice);
        }

        if (numRooms != null) {
            sql.append(" AND num_rooms = ? ");
            params.add(numRooms);
        }

        if (isAvailable != null) {
            sql.append(" AND is_available = ? ");
            params.add(isAvailable);
        }

        List<Property> properties = jdbcTemplate.query(sql.toString(), mapper, params.toArray());

        return properties.stream()
                .map(this::buildPropertyDetails)
                .toList();
    }

    public List<PropertyDetails> searchByPrefix(String prefix) {

        String sql = """
        SELECT * FROM properties
        WHERE LOWER(title) LIKE LOWER(?)
           OR LOWER(property_type) LIKE LOWER(?)
           OR LOWER(city) LIKE LOWER(?)
           OR LOWER(district) LIKE LOWER(?)
           OR LOWER(address) LIKE LOWER(?)
        ORDER BY created_at DESC
    """;

        String search = prefix + "%";

        List<Property> properties = jdbcTemplate.query(
                sql,
                mapper,
                search,
                search,
                search,
                search,
                search
        );

        return properties.stream()
                .map(this::buildPropertyDetails)
                .toList();
    }

    public Favorite favorite(int propertyId, int tenantId) {

        String insertSql = """
        INSERT INTO favorites (tenant_id, property_id)
        VALUES (?, ?)
    """;

        int rows = jdbcTemplate.update(insertSql, tenantId, propertyId);

        if (rows == 0) {
            throw new RuntimeException("Failed to add property to favorites");
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