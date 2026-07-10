package com.yyjy.exam.user.api;

import cn.dev33.satoken.annotation.SaCheckRole;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.user.dto.UserPageView;
import com.yyjy.exam.entity.user.dto.UserSaveInput;
import com.yyjy.exam.entity.user.dto.UserUpdateInput;
import com.yyjy.exam.user.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.meta.Api;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SaCheckRole("admin")
@Api
@RestController
@RequiredArgsConstructor
@RequestMapping("/user/admin")
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * 用户列表（支持 keyword 模糊搜索，分页）
     */
    @Api
    @GetMapping("/list")
    public R<List<UserPageView>> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return R.ok(adminUserService.list(keyword, page, size));
    }

    /**
     * 新增用户
     */
    @Api
    @PostMapping("/add")
    public R<Void> addUser(@RequestBody UserSaveInput input) {
        adminUserService.save(input);
        return R.ok();
    }

    /**
     * 更新用户
     */
    @Api
    @PutMapping("/update")
    public R<Void> updateUser(@RequestBody UserUpdateInput input) {
        adminUserService.update(input);
        return R.ok();
    }

    /**
     * 删除用户
     */
    @Api
    @DeleteMapping("/remove/{id}")
    public R<Void> removeUser(@PathVariable long id) {
        adminUserService.remove(id);
        return R.ok();
    }

    /**
     * 用户详情
     */
    @Api
    @GetMapping("/{id}")
    public R<UserPageView> getUser(@PathVariable long id) {
        UserPageView user = adminUserService.getById(id);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return R.ok(user);
    }
}
