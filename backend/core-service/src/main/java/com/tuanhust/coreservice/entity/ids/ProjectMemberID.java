package com.tuanhust.coreservice.entity.ids;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProjectMemberID implements Serializable
{
    private String project;
    private String memberId;
}