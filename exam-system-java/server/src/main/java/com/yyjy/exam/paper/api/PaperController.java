package com.yyjy.exam.paper.api;

import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.paper.constant.PaperStatus;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.dto.PaperSaveInput;
import com.yyjy.exam.entity.paper.dto.PaperUpdateInput;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.paper.service.PaperService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.meta.Api;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Api
@RestController
@RequestMapping("/paper")
@RequiredArgsConstructor
public class PaperController {

    private final PaperService paperService;

    @Api
    @PostMapping("/add")
    public R<Void> addPaper(@RequestBody PaperSaveInput paper) {
        paperService.addPaper(paper);
        return R.ok();
    }

    @Api
    @PutMapping("/update")
    public R<Void> updatePaper(@RequestBody PaperUpdateInput paper) {
        paperService.updatePaper(paper);
        return R.ok();
    }

    @Api
    @DeleteMapping("/remove/{id}")
    public R<Void> removePaper(@PathVariable int id) {
        paperService.removePaper(id);
        return R.ok();
    }

    @Api
    @GetMapping("/{id}")
    public R<PaperDetail> getPaper(@PathVariable int id) {
        return R.ok(paperService.getPaper(id));
    }

    @Api
    @GetMapping("/list")
    public R<List<Paper>> listPapers(
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "status", required = false) PaperStatus status
    ) {
        return R.ok(paperService.listPapersByNameAndStatus(name, status));
    }

    @Api
    @PostMapping("/{id}/status")
    public R<Void> updatePaperStatus(
            @PathVariable int id,
            @RequestParam String status
    ) {
        paperService.updateStatus(id, status);
        return R.ok();
    }

    @Api
    @PostMapping("/ai")
    public R<Paper> aiPaper(@RequestBody PaperAiSaveDto dto) {
        return R.ok(paperService.aiCreatePaper(dto));
    }
}
