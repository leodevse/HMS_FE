import {createTheme, rem} from '@mantine/core';

export const theme = createTheme({
	// Ưu tiên màu Teal của bạn
	primaryColor: 'teal',
	defaultRadius: 'md',

	// Ưu tiên font Be Vietnam Pro
	fontFamily: 'Be Vietnam Pro, sans-serif',

	// Cấu hình Headings từ theme dưới
	headings: {
		fontWeight: '600',
		sizes: {
			h1: {fontSize: rem(28), lineHeight: '1.2'},
			h2: {fontSize: rem(24), lineHeight: '1.3'},
			h3: {fontSize: rem(20), lineHeight: '1.4'},
		}
	},

	// Merge fontSizes (Sử dụng rem để đồng bộ với Mantine v7)
	fontSizes: {
		xs: rem(12),
		sm: rem(13), // Giữ 13px theo ý bạn
		md: rem(14), // Giữ 14px theo ý bạn
		lg: rem(16), // Giữ 16px theo ý bạn
		xl: rem(20),
	},

	// Bổ sung spacing hệ thống
	spacing: {
		xs: rem(8),
		sm: rem(12),
		md: rem(16),
		lg: rem(24),
		xl: rem(32),
	},

	// Hợp nhất các components của cả 2 theme
	components: {
		Button: {
			defaultProps: {radius: 'md'},
		},
		TextInput: {
			defaultProps: {radius: 'md'},
		},
		PasswordInput: {
			defaultProps: {radius: 'md'},
		},
		Select: {
			defaultProps: {radius: 'md'},
		},
		Paper: {
			defaultProps: {radius: 'md'},
		},
		Card: {
			defaultProps: {
				radius: 'md',
				shadow: 'sm',
				padding: 'md',
			}
		},
		Modal: {
			defaultProps: {
				radius: 'md',
				shadow: 'md',
			}
		},
	}
});