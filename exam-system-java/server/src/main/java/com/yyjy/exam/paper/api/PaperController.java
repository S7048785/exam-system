package com.yyjy.exam.paper.api;

import cn.dev33.satoken.annotation.SaCheckRole;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperFetcher;
import com.yyjy.exam.entity.paper.io.req.PaperSaveInput;
import com.yyjy.exam.entity.paper.io.req.PaperUpdateInput;
import com.yyjy.exam.paper.constant.PaperStatus;
import com.yyjy.exam.paper.service.PaperService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.client.meta.Api;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SaCheckRole("admin")
@Api
@RestController
@RequestMapping("/paper")
@RequiredArgsConstructor
public class PaperController {
	
	public static final Fetcher<Paper> PAPER_ITEM =
			PaperFetcher.$
					.name()
					.description()
					.status()
					.totalScore()
					.questionCount()
					.duration()
					.createTime();
	
	private final PaperService paperService;
	
	/**
	 * 新增试卷
	 */
	@Api
	@PostMapping("/add")
	public R<Void> addPaper(@RequestBody PaperSaveInput paper) {
		paperService.addPaper(paper);
		return R.ok();
	}
	
	/**
	 * 更新试卷
	 */
	@Api
	@PutMapping("/update")
	public R<Void> updatePaper(@RequestBody PaperUpdateInput paper) {
		paperService.updatePaper(paper);
		return R.ok();
	}
	
	/**
	 * 删除试卷
	 */
	@Api
	@DeleteMapping("/remove/{id}")
	public R<Void> removePaper(@PathVariable int id) {
		paperService.removePaper(id);
		return R.ok();
	}
	
	/**
	 * 获取试卷详情
	 */
	@Api
	@GetMapping("/{id}")
	public R<PaperDetail> getPaper(@PathVariable int id) {
		return R.ok(paperService.getPaper(id));
	}
	
	/**
	 * 获取试卷列表
	 */
	@Api
	@GetMapping("/list")
	public R<List<@FetchBy("PAPER_ITEM") Paper>> listPapers(
			@RequestParam(name = "name", required = false) String name,
			@RequestParam(name = "status", required = false) PaperStatus status,
			@RequestParam(name = "page", defaultValue = "1") int page,
			@RequestParam(name = "size", defaultValue = "10") int size
	) {
		return R.ok(paperService.listPapersByNameAndStatus(name, status, page, size, PAPER_ITEM));
	}
	
	/**
	 * 更新试卷状态
	 */
	@Api
	@PostMapping("/{id}/status")
	public R<Void> updatePaperStatus(
			@PathVariable int id,
			@RequestParam String status
	) {
		paperService.updateStatus(id, status);
		return R.ok();
	}
	
	/**
	 * AI智能组卷
	 */
	@Api
	@PostMapping("/ai")
	public R<Paper> aiPaper(@RequestBody PaperAiSaveDto dto) {
		return R.ok(paperService.aiCreatePaper(dto));
	}
}
