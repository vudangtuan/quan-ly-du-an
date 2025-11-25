package com.tuanhust.authservice;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.entity.User;
import com.tuanhust.authservice.repository.UserRepository;
import com.tuanhust.authservice.repsonse.UserInfo;
import com.tuanhust.authservice.service.impl.UserServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private void mockSecurityContext(String userId) {
        UserPrincipal principal = UserPrincipal.builder().userId(userId).build();
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(principal);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("Get Users by IDs")
    void getUsers_Success() {
        List<String> ids = Arrays.asList("1", "2");
        List<User> users = Arrays.asList(
                User.builder().userId("1").email("a@a.com").fullName("A").build(),
                User.builder().userId("2").email("b@b.com").fullName("B").build()
        );

        when(userRepository.findAllById(ids)).thenReturn(users);

        List<UserPrincipal> result = userService.getUsers(ids);

        assertEquals(2, result.size());
        assertEquals("a@a.com", result.get(0).getEmail());
    }

    @Test
    @DisplayName("Search Users excludes current user")
    void searchUsers_Success() {
        String currentUserId = "my-id";
        mockSecurityContext(currentUserId);

        String searchText = "tuan";
        Pageable pageable = PageRequest.of(0, 10);
        List<UserInfo> userList = List.of(new UserInfo("other-id", "tuan@hust.com", "Tuan"));
        Page<UserInfo> page = new PageImpl<>(userList);

        when(userRepository.searchUsers(searchText, pageable, currentUserId)).thenReturn(page);

        Page<UserInfo> result = userService.searchUsers(searchText, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(userRepository).searchUsers(searchText, pageable, currentUserId);
    }

    @Test
    @DisplayName("Update Name Success")
    void updateName_Success() {
        String currentUserId = "my-id";
        mockSecurityContext(currentUserId);

        User user = User.builder().userId(currentUserId).fullName("Old Name").role(User.Role.USER).build();
        when(userRepository.findById(currentUserId)).thenReturn(Optional.of(user));

        UserInfo result = userService.updateName("New Name");

        assertEquals("New Name", result.getFullName());
        assertEquals("New Name", user.getFullName()); // Kiểm tra entity đã được set
    }
}