import { useMutation, useQueryClient } from '@tanstack/react-query'
import {api} from "#/ApiInstance.ts";
import {toast} from "sonner";
// 基础封装
const useBasePaperMutation = <TVariables>(
		mutationFn: (variables: TVariables) => Promise<any>,
		successMsg = "操作成功"
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn,
		onSuccess: (data) => {
			if (data.code === 200) {
				toast.success(successMsg);
				queryClient.invalidateQueries({ queryKey: ['papers'] });
			} else {
				toast.error(data.msg || "操作失败");
			}
		},
		onError: (error: any) => {
			toast.error(error.message || "网络错误");
		},
	});
};

// 业务使用：极其简洁
export const useChangeStatus = () =>
		useBasePaperMutation(api.paperController.updatePaperStatus, "状态修改成功");

export const useDeleteMutation = () =>
		useBasePaperMutation((id: number) => api.paperController.removePaper({ id }), "删除成功");