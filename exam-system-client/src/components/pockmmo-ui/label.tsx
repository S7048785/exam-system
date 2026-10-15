import React from 'react';
import { cn } from "#/lib/utils.ts";

// 继承原生的 label 属性，支持 htmlFor、onClick 等
export interface GameLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
	children: React.ReactNode;
}

export const GameLabel: React.FC<GameLabelProps> = ({
																											children,
																											className = '',
																											...props
																										}) => {
	const baseClasses = `
    h-10 px-1
    flex justify-center items-center
    border border-[#292d2e]
    bg-linear-to-b from-[#466171] to-[#3f5260]
    shadow-[0_0_1px_black]
    text-sm text-white
    select-none
  `;

	return (
			<label className={cn(baseClasses, className)} {...props}>
				{children}
			</label>
	);
};