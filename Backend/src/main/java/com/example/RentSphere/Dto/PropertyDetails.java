package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Composite view model combining a {@link Property} record with its associated image URLs and cover photo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyDetails {

    private Property property;
    private List<String> propertyImages;
    private String coverPic;
}
