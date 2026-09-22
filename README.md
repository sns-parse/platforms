# sns-parse platforms

sns-parse 的平台定义 monorepo。

## 包

- `@sns-parse/platform-<type>` ×27：每个平台一个包（`PlatformDefinition`：链接规则 + 双网关专属 API）
- `@sns-parse/platforms`：聚合全部定义，导出 `BUILTIN_PLATFORMS` 与 `BUILTIN_LINK_RULES`

## 开发

```bash
npm install
npm run build
```

## 发布

```bash
npm publish --workspaces --access public
```

## 许可

MIT
