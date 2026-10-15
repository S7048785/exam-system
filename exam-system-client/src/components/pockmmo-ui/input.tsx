import React from 'react';
import { cn } from "#/lib/utils.ts";

// 继承原生的 input 属性，直接支持 value、onChange、placeholder、disabled 等所有原生属性
export interface GameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const GameInput: React.FC<GameInputProps> = ({
																											className = '',
																											type = 'text',
																											...props
																										}) => {
	const baseClasses = `
    w-full h-10 rounded-xs border-2 border-[#292d2e]
    px-1 text-sm text-white bg-transparent
    shadow-[0_0_2px_#292d2e] outline-none
    caret-[#5db1ff]
    transition-colors duration-150
    placeholder:text-white/40
    focus:border-[#5db1ff]
    disabled:cursor-not-allowed disabled:opacity-50
  `;

	return (
			<input
					type={type}
					className={cn(baseClasses, className)}
					{...props}
			/>
	);
};