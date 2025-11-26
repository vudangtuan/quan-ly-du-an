package com.tuanhust.activityservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaginatedResponse<T>{
    List<T> content;
    long totalPages;
    long totalElements;
    int number;
    int size;
    boolean first;
    boolean last;
}