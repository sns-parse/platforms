/**
 * @sns-parse/platforms：纯依赖聚合包。
 *
 * 仅通过 dependencies 自动安装全部 27 个 platform-* 碎片包；
 * 不 re-export 任何定义（避免统一入口造成耦合）。
 * 需要具体平台时，直接依赖对应的 @sns-parse/platform-<type> 包。
 */
export {}
