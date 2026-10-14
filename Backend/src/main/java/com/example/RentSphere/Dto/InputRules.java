package com.example.RentSphere.Dto;

/**
 * Regular expressions shared by the request DTOs so every free-text field rejects the same
 * junk: markup, control characters and anything that is not a plausible value for the field.
 */
public final class InputRules {

    private InputRules() {
    }

    /** Names: letters in any script, digits, spaces and a little punctuation. */
    public static final String NAME = "^[\\p{L}\\p{M}\\p{N} .,'_-]+$";

    /** Single-line text: no angle brackets, no control characters (so no line breaks). */
    public static final String LINE = "^[^<>\\p{Cntrl}]*$";

    /** Multi-line text: line breaks are fine, markup is not. */
    public static final String TEXT = "^[^<>]*$";

    /** Empty, or an international-style phone number. */
    public static final String PHONE = "^$|^\\+?[0-9][0-9 ()-]{6,19}$";

    /**
     * Empty, an https URL, or a path under the site's own /uploads folder. Rules out
     * {@code javascript:} and {@code data:} URIs and plain-http hotlinks.
     */
    public static final String IMAGE_URL = "^$|^https://[^\\s<>\"'\\\\]+$|^/uploads/[A-Za-z0-9/_.-]+$";
}
