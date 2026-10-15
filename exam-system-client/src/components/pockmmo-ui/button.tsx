import React from 'react';
import {cn} from "#/lib/utils.ts";

// 继承原生的按钮属性，这样你可以直接使用 onClick, disabled, type 等所有原生属性
export interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode; // 按钮文本
}

export const GameButton: React.FC<GameButtonProps> = ({
																												children,
																												className = '',
																												...props
																											}) => {
	// 提取出原来所有的样式类
	const baseClasses = `
    group relative rounded-xs border border-[#2a3037] bg-linear-to-b from-[#565d63] to-[#3c4247] px-8 h-10 shadow-[inset_1px_1px_1px_#ffffff26,inset_-1px_-1px_0_#ffffff26,0_1px_4px_#00000099] before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-t before:from-[#4a6a80] before:to-transparent before:to-70% before:opacity-0 before:transition-opacity before:duration-150 before:ease-in-out before:content-[''] hover:before:opacity-100 active:from-[#3b4247] active:to-[#585f65]
  `;

	return (
			<button
					className={cn(baseClasses, className)}
					{...props} // 这里会自动包含 onClick、disabled、type 等所有原生属性
			>
      <span className="relative z-10 inline-block transition-transform duration-75 group-active:translate-x-px group-active:translate-y-px text-sm text-white">
        {children}
      </span>
			</button>
	);
};