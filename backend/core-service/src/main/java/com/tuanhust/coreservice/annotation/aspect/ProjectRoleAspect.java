package com.tuanhust.coreservice.annotation.aspect;

import com.tuanhust.coreservice.annotation.ProjectRoles;
import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.repository.ProjectMemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Arrays;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
public class ProjectRoleAspect {
    private final ProjectMemberRepository projectMemberRepository;

    @Around("@annotation(projectRoles)")
    @SuppressWarnings("unchecked")
    public Object checkRole(ProceedingJoinPoint joinPoint, ProjectRoles projectRoles) throws Throwable {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof UserPrincipal userPrincipal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        String userId = userPrincipal.getUserId();

        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        Map<String, String> uriTemplateVars = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        String projectId = uriTemplateVars.get("projectId");

        if (projectId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Cannot determine projectId for role check. Missing @PathVariable('projectId')?");
        }

        String[] roles = projectRoles.roles();
        if (roles.length == 0) {
            roles = new String[]{"OWNER", "EDITOR", "VIEWER", "COMMENTER"};
        }

        Role roleUserId = projectMemberRepository.getRole(projectId, userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện")
        );

        if (!Arrays.asList(roles).contains(roleUserId.name())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện");
        }

        return joinPoint.proceed();
    }
}