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
import com.yyjy.exam.user.view.ConfirmPage;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    /** 结果页响应用的 Content-Type，charset 必须显式写死 UTF-8。 */
    private static final MediaType TEXT_HTML_UTF8 = MediaType.parseMediaType("text/html;charset=UTF-8");

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

    /**
     * 邮箱验证落地页（邮件里的验证链接，无 @SaCheckLogin，游客可访问）。
     * <p>
     * 直接返回一张自包含的 HTML 结果页，而不是 302 回首页 —— 原来成功和失败都跳首页，
     * 用户根本看不出验证到底成没成。失败也不再抛给全局异常处理（那会返回 422 纯文本）。
     * <p>
     * ⚠️ 必须显式指定 charset=UTF-8：StringHttpMessageConverter 在 Content-Type 没带 charset 时
     * 会用默认字符集编码，页面里的中文会变乱码。
     */
    @GetMapping("/confirm")
    public ResponseEntity<String> confirmUser(@RequestParam(required = false) String id) {
        // id 缺失/空白不走仓储查询（findByUuid(null) 的行为不可依赖），直接当失效处理
        if (id == null || id.isBlank()) {
            return failPage();
        }
        try {
            userService.confirmUser(id);
            return html(ConfirmPage.success(frontUrl() + "/login"));
        } catch (BusinessException e) {
            return failPage();
        }
    }

    private ResponseEntity<String> failPage() {
        return html(ConfirmPage.failure(frontUrl() + "/register"));
    }

    private ResponseEntity<String> html(String body) {
        return ResponseEntity.ok()
                       .contentType(TEXT_HTML_UTF8)
                       .body(body);
    }

    /** front-url 有可能被配成带结尾斜杠，统一去掉再拼，避免拼出 {@code //login}。 */
    private String frontUrl() {
        String url = mailProperties.frontUrl();
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
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
