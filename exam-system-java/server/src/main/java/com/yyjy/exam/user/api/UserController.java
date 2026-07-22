package com.yyjy.exam.user.api;

import cn.dev33.satoken.annotation.SaCheckRole;
import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.user.dto.UserPageView;
import com.yyjy.exam.entity.user.dto.UserSaveInput;
import com.yyjy.exam.entity.user.dto.UserUpdateInput;
import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.entity.user.entity.UsersFetcher;
import com.yyjy.exam.entity.user.io.req.UserLoginReq;
import com.yyjy.exam.entity.user.io.req.UserRegisterReq;
import com.yyjy.exam.common.property.MailProperties;
import com.yyjy.exam.user.service.AdminUserService;
import com.yyjy.exam.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {

    public static final Fetcher<Users> USER_INFO =
            UsersFetcher.$
                    .email()
                    .realName()
                    .role();
    private final UserService userService;
    private final MailProperties mailProperties;
    private final AdminUserService adminUserService;

    // ========== 公开端点 ==========

    @PostMapping("/login")
    public R<@FetchBy("USER_INFO") Users> loginUser(@RequestBody UserLoginReq user) {
        var userRes = userService.login(user.email(), user.password(), USER_INFO);
        return R.ok(userRes);
    }

    @PostMapping("/register")
    public R<Void> registerUser(@RequestBody UserRegisterReq user) {
        userService.registerUser(user.email(), user.realName(), user.password(), user.captchaToken());
        return R.ok();
    }

    @PostMapping("/logout")
    public R<Void> logout() {
        StpUtil.logout();
        return R.ok();
    }

    @GetMapping("/confirm")
    public ResponseEntity<Void> confirmUser(@RequestParam String id) {
        try {
            userService.confirmUser(id);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(mailProperties.frontUrl()))
                    .build();
        } catch (BusinessException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(mailProperties.frontUrl()))
                    .build();
        }
    }

    @GetMapping("/info")
    public R<@FetchBy("USER_INFO") Users> getUserInfo() {
        var user = userService.getUserInfo(USER_INFO);
        if (user == null) {
            return R.ok();
        }
        return R.ok(user);
    }

    // ========== 管理员端点 ==========

    @SaCheckRole("admin")
    @GetMapping("/admin/list")
    public R<List<UserPageView>> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return R.ok(adminUserService.list(keyword, page, size));
    }

    @SaCheckRole("admin")
    @PostMapping("/admin/add")
    public R<Void> addUser(@RequestBody UserSaveInput input) {
        adminUserService.save(input);
        return R.ok();
    }

    @SaCheckRole("admin")
    @PutMapping("/admin/update")
    public R<Void> updateUser(@RequestBody UserUpdateInput input) {
        adminUserService.update(input);
        return R.ok();
    }

    @SaCheckRole("admin")
    @DeleteMapping("/admin/remove/{id}")
    public R<Void> removeUser(@PathVariable long id) {
        adminUserService.remove(id);
        return R.ok();
    }

    @SaCheckRole("admin")
    @GetMapping("/admin/{id}")
    public R<UserPageView> getUser(@PathVariable long id) {
        UserPageView user = adminUserService.getById(id);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return R.ok(user);
    }
}
