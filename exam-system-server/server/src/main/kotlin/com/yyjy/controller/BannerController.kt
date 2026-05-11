package com.yyjy.controller

import com.yyjy.common.BusinessException
import com.yyjy.common.R
import com.yyjy.models.entity.Banners
import com.yyjy.models.entity.by
import com.yyjy.models.entity.dto.BannerSaveInput
import com.yyjy.repository.BannersRepository
import com.yyjy.service.FileUploadService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.babyfish.jimmer.client.FetchBy
import org.babyfish.jimmer.client.meta.Api
import org.babyfish.jimmer.spring.model.SortUtils
import org.babyfish.jimmer.sql.ast.mutation.SaveMode
import org.babyfish.jimmer.sql.kt.fetcher.newFetcher
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

/**
 * @author Nyxcirea
 * date 2026/4/4
 * description: 轮播图控制器 - 处理轮播图管理相关的HTTP请求
 */
@Api
@Tag(name = "轮播图管理", description = "轮播图相关操作，包括图片上传、轮播图增删改查、状态管理等功能")
@RequestMapping("/banners")
@RestController
class BannerController(
    private val bannersRepository: BannersRepository,
    private val fileUploadService: FileUploadService
) {

    @Api
    @Operation(summary = "上传轮播图图片", description = "将图片文件上传到MinIO服务器，返回访问图片URL")
    @PostMapping("/upload-image")
    fun uploadImage(@RequestParam("file") file: MultipartFile): R<String> {
        val fileUrl = fileUploadService.uploadImage(file)
        return R.ok(fileUrl)
    }

    @Api
    @Operation(summary = "获取启用的轮播图", description = "获取状态为启用的轮播图列表，供前台首页展示使用")
    @GetMapping("/active")
    fun getActiveBanners(): R<List<@FetchBy("BANNER_ITEM_ADMIN") Banners>> {
        return R.ok(bannersRepository.findBannersByActive(BANNER_ITEM, true))
    }

    @Api
    @Operation(summary = "获取所有轮播图", description = "获取所有轮播图列表，包括启用和禁用的，供管理后台使用")
    @GetMapping("/list")
    fun getAllBanners(): R<List<@FetchBy("BANNER_ITEM_ADMIN") Banners>> {
        val res = bannersRepository.findAll(BANNER_ITEM_ADMIN, SortUtils.toSort("sortOrder asc"))
        return R.ok(res)
    }

    @Api
    @Operation(summary = "根据ID获取轮播图", description = "根据轮播图ID获取单个轮播图的详细信息(未启用)")
    @GetMapping("/{id}")
    fun getBannerById(@PathVariable id: Long): R<Banners> {
        return R.ok(bannersRepository.findById(id).orElseThrow { BusinessException("轮播图不存在") })
    }

    @Api
    @Operation(summary = "添加轮播图", description = "创建新的轮播图，需要提供图片URL、标题、跳转链接等信息")
    @PostMapping("/add")
    fun addBanner(@RequestBody banner: BannerSaveInput): R<String?> {
        bannersRepository.save(banner, SaveMode.INSERT_ONLY)
        return R.ok()
    }

    @Api
    @Operation(summary = "更新轮播图", description = "更新轮播图的信息，包括图片、标题、跳转链接、排序等")
    @PutMapping("/update")
    fun updateBanner(@RequestBody banner: Banners): R<String?> {
        bannersRepository.save(banner, SaveMode.UPDATE_ONLY)
        return R.ok()
    }

    @Api
    @Operation(summary = "删除轮播图", description = "根据ID删除指定的轮播图")
    @DeleteMapping("/delete/{id}")
    fun deleteBanner(@PathVariable id: Long): R<String?> {
        bannersRepository.deleteById(id)
        return R.ok()
    }

    @Api
    @Operation(summary = "切换轮播图状态", description = "启用或禁用指定的轮播图，禁用后不会在前台显示")
    @PutMapping("/toggle/{id}")
    fun toggleBannerStatus(@PathVariable("id") bannerId: Long, bannerActive: Boolean): R<String?> {
        bannersRepository.save(Banners { id = bannerId; active = bannerActive  })
        return R.ok()
    }

    companion object {
        val BANNER_ITEM = newFetcher(Banners::class).by {
            allScalarFields()
            active(false)
            createTime(false)
            updateTime(false)
        }
        val BANNER_ITEM_ADMIN = newFetcher(Banners::class).by {
            allScalarFields()
            updateTime(false)
        }
    }
}