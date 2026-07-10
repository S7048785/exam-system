package com.yyjy.exam.user.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yyjy.exam.common.config.GlobalExceptionHandler;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.user.dto.UserPageView;
import com.yyjy.exam.entity.user.dto.UserSaveInput;
import com.yyjy.exam.entity.user.dto.UserUpdateInput;
import com.yyjy.exam.user.service.AdminUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminUserService adminUserService;

    @InjectMocks
    private AdminUserController adminUserController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminUserController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ========== GET /user/admin/list ==========

    @Test
    void listUsers_shouldReturnUserList() throws Exception {
        UserPageView user = new UserPageView();
        user.setId(1L);
        user.setEmail("user@example.com");
        user.setRealName("Test User");
        user.setRole("user");
        user.setStatus("active");

        when(adminUserService.list(null, 1, 10)).thenReturn(List.of(user));

        mockMvc.perform(get("/user/admin/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].email").value("user@example.com"));

        verify(adminUserService).list(null, 1, 10);
    }

    @Test
    void listUsers_shouldPassPagingParams() throws Exception {
        when(adminUserService.list(any(), anyInt(), anyInt())).thenReturn(List.of());

        mockMvc.perform(get("/user/admin/list?page=2&size=20"))
                .andExpect(status().isOk());

        verify(adminUserService).list(null, 2, 20);
    }

    @Test
    void listUsers_shouldPassKeyword() throws Exception {
        when(adminUserService.list(any(), anyInt(), anyInt())).thenReturn(List.of());

        mockMvc.perform(get("/user/admin/list?keyword=test"))
                .andExpect(status().isOk());

        verify(adminUserService).list("test", 1, 10);
    }

    // ========== POST /user/admin/add ==========

    @Test
    void addUser_shouldCallService() throws Exception {
        doNothing().when(adminUserService).save(any(UserSaveInput.class));

        String body = """
                {
                    "email": "new@example.com",
                    "realName": "New User",
                    "password": "pass123",
                    "role": "user",
                    "status": "active"
                }
                """;

        mockMvc.perform(post("/user/admin/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(adminUserService).save(any(UserSaveInput.class));
    }

    // ========== PUT /user/admin/update ==========

    @Test
    void updateUser_shouldCallService() throws Exception {
        doNothing().when(adminUserService).update(any(UserUpdateInput.class));

        String body = """
                {
                    "id": 1,
                    "email": "updated@example.com",
                    "realName": "Updated Name"
                }
                """;

        mockMvc.perform(put("/user/admin/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(adminUserService).update(any(UserUpdateInput.class));
    }

    // ========== DELETE /user/admin/remove/{id} ==========

    @Test
    void removeUser_shouldCallService() throws Exception {
        doNothing().when(adminUserService).remove(1L);

        mockMvc.perform(delete("/user/admin/remove/1"))
                .andExpect(status().isOk());

        verify(adminUserService).remove(1L);
    }

    // ========== GET /user/admin/{id} ==========

    @Test
    void getUser_shouldReturnUser() throws Exception {
        UserPageView user = new UserPageView();
        user.setId(1L);
        user.setEmail("found@example.com");
        user.setRealName("Found User");
        when(adminUserService.getById(1L)).thenReturn(user);

        mockMvc.perform(get("/user/admin/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("found@example.com"));

        verify(adminUserService).getById(1L);
    }

    @Test
    void getUser_shouldReturn422_whenNotFound() throws Exception {
        when(adminUserService.getById(999L)).thenReturn(null);

        mockMvc.perform(get("/user/admin/999"))
                .andExpect(status().isUnprocessableEntity());

        verify(adminUserService).getById(999L);
    }
}
