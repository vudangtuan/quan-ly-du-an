package com.tuanhust.coreservice.entity.ids;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommentMentionsId implements Serializable {
    private String comment;
    private String mentionId;
}