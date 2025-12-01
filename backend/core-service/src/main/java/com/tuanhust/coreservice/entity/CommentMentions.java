package com.tuanhust.coreservice.entity;

import com.tuanhust.coreservice.entity.ids.CommentMentionsId;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@IdClass(CommentMentionsId.class)
@Table(name = "comment_mentions")
public class CommentMentions {
    @Column(name = "comment_id",insertable = false,updatable = false)
    private String commentId;
    @Id
    @Column(nullable = false)
    private String mentionId;
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id",nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Comment comment;
}