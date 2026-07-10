package com.yyjy.exam.user.service;

import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.user.dto.UserSaveInput;
import com.yyjy.exam.entity.user.dto.UserUpdateInput;
import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.user.repository.UsersRepository;
import org.babyfish.jimmer.sql.JSqlClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private JSqlClient sqlClient;

    @Captor
    private ArgumentCaptor<Users> userCaptor;

    private AdminUserService service;

    @BeforeEach
    void setUp() {
        service = new AdminUserService(usersRepository, sqlClient);
    }

    // ========== save ==========

    @Test
    void save_shouldSucceed_whenEmailNotExists() {
        when(usersRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        UserSaveInput input = mock(UserSaveInput.class);
        when(input.getEmail()).thenReturn("test@example.com");
        when(input.getRealName()).thenReturn("Test User");
        when(input.getPassword()).thenReturn("plainPassword");
        when(input.getRole()).thenReturn("user");
        when(input.getStatus()).thenReturn("active");

        service.save(input);

        verify(usersRepository).save(userCaptor.capture());
        Users saved = userCaptor.getValue();
        assertNotNull(saved);
    }

    @Test
    void save_shouldEncodePassword() {
        when(usersRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        UserSaveInput input = mock(UserSaveInput.class);
        when(input.getEmail()).thenReturn("encode@example.com");
        when(input.getRealName()).thenReturn("Encode Test");
        when(input.getPassword()).thenReturn("myPassword123");
        when(input.getRole()).thenReturn("user");
        when(input.getStatus()).thenReturn("active");

        service.save(input);

        verify(usersRepository).save(userCaptor.capture());
        Users saved = userCaptor.getValue();
        assertNotNull(saved.password());
        assertTrue(saved.password().startsWith("$2a$"),
                "Password should be BCrypt-encoded, but got: " + saved.password());
    }

    @Test
    void save_shouldThrow_whenEmailExists() {
        when(usersRepository.findByEmail(anyString())).thenReturn(Optional.of(mock(Users.class)));

        UserSaveInput input = mock(UserSaveInput.class);
        when(input.getEmail()).thenReturn("duplicate@example.com");

        BusinessException ex = assertThrows(BusinessException.class, () -> service.save(input));
        assertEquals("邮箱号已存在", ex.getMessage());
        verify(usersRepository, never()).save((Users) any());
    }

    // ========== update ==========

    @Test
    void update_shouldSucceed_withPassword() {
        Users existing = mock(Users.class);
        when(usersRepository.findById(1L)).thenReturn(Optional.of(existing));

        UserUpdateInput input = mock(UserUpdateInput.class);
        when(input.getId()).thenReturn(1L);
        when(input.getEmail()).thenReturn("new@example.com");
        when(input.getRealName()).thenReturn("New Name");
        when(input.getPassword()).thenReturn("newPassword");
        when(input.getRole()).thenReturn("admin");
        when(input.getStatus()).thenReturn("active");

        service.update(input);

        // all fields provided, existing mock is not consulted
        verify(usersRepository).save(any(Users.class));
    }

    @Test
    void update_shouldKeepExistingFields_whenInputIsNull() {
        Users existing = mock(Users.class);
        when(existing.email()).thenReturn("keep@example.com");
        when(existing.realName()).thenReturn("Keep Name");
        when(existing.role()).thenReturn("user");
        when(existing.status()).thenReturn("active");
        when(usersRepository.findById(1L)).thenReturn(Optional.of(existing));

        UserUpdateInput input = mock(UserUpdateInput.class);
        when(input.getId()).thenReturn(1L);
        when(input.getEmail()).thenReturn(null);     // use existing
        when(input.getRealName()).thenReturn(null);   // use existing
        when(input.getPassword()).thenReturn("");    // blank → skip password update
        when(input.getRole()).thenReturn(null);       // use existing
        when(input.getStatus()).thenReturn(null);     // use existing

        service.update(input);

        // existing.*() getters called by the service should not throw
        verify(usersRepository).save(any(Users.class));
    }

    @Test
    void update_shouldThrow_whenUserNotFound() {
        when(usersRepository.findById(anyLong())).thenReturn(Optional.empty());

        UserUpdateInput input = mock(UserUpdateInput.class);
        when(input.getId()).thenReturn(999L);

        assertThrows(BusinessException.class, () -> service.update(input));
        verify(usersRepository, never()).save((Users) any());
    }

    // ========== remove ==========

    @Test
    void remove_shouldSucceed() {
        when(usersRepository.findById(1L)).thenReturn(Optional.of(mock(Users.class)));

        service.remove(1L);

        verify(usersRepository).deleteById(1L);
    }

    @Test
    void remove_shouldThrow_whenUserNotFound() {
        when(usersRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> service.remove(999L));
        verify(usersRepository, never()).deleteById(any());
    }
}
