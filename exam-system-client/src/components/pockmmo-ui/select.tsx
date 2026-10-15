import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from "#/lib/utils.ts";

// 继承原生 select 的所有属性
export interface GameSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	children: React.ReactNode; // 传入 <option> 列表
}

export const GameSelect: React.FC<GameSelectProps> = ({
																												children,
																												className = '',
																												...props
																											}) => {
	return (
			<div className="group relative w-full">
				{/* 1. 基础背景层（含边框、阴影） */}
				<div
						className="
          absolute inset-0 rounded-xs border border-[#292d2e]
          bg-linear-to-b from-[#565d63] to-[#3c4247]
          shadow-[inset_1px_1px_1px_#ffffff26,inset_-1px_-1px_0_#ffffff26,0_1px_4px_#00000099]
          transition-colors duration-150
          group-focus-within:border-[#5db1ff]
        "
				/>

				{/* 2. hover 高光层 */}
				<div
						className="
          pointer-events-none absolute inset-0 rounded-xs
          bg-linear-to-t from-[#4a6a80] to-transparent to-70%
          opacity-0 transition-opacity duration-150
          group-hover:opacity-100
        "
				/>

				{/* 3. select：透明背景，只显示文字，在最上层 */}
				<select
						className={cn(
								'relative z-10 w-full h-10 px-2',
								'text-sm text-white bg-transparent',
								'outline-none cursor-pointer appearance-none',
								'disabled:cursor-not-allowed disabled:opacity-50',
								className,
						)}
						{...props}
				>
					{children}
				</select>

				{/* 4. 箭头：也在最上层 */}
				<ChevronDown className="pointer-events-none absolute right-2 top-1/2 z-10 size-4 -translate-y-1/2 text-white/60" />
			</div>
	);
};