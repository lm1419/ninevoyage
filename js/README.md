# js 目录说明

这个目录里的游戏脚本仍然使用浏览器传统 `<script>` 加载方式，不是 ES Module。各文件共享同一个全局作用域，所以函数声明可以跨文件调用，但加载顺序很重要。

## 加载顺序

`无尽之地.html` 里的顺序是运行时依赖顺序：

1. `data-helpers.js`
2. `visual-renderer.js`
3. `data/*.js`
4. `game-state.js`
5. `game-ui.js`
6. `game-events.js`
7. `game-battle.js`
8. `game-progression.js`
9. `game-menu-shop.js`
10. `game-utils.js`
11. `game.js`

Do not reorder the production `game-*.js` files casually; `game-debug.js` is loaded last so console-only helpers can use the fully initialized game.

## 文件职责

- `data-helpers.js`：给数据文件使用的事件构造辅助函数，例如 `resultEvent()`、`choiceEvent()`。
- `visual-renderer.js`：Canvas 场景渲染器，暴露 `VisualRenderer` 给游戏 UI 调用。
- `game-state.js`：全局数据依赖、`SAVE_KEY`、`$()`、`state`，以及新游戏、副本切换等核心状态流程。
- `game-ui.js`：日志、打字机、按钮、主界面、侧栏、战斗面板、视觉区域渲染。
- `game-events.js`：前进/后退、固定事件、随机事件、事件弹窗、事件结果预览。
- `game-battle.js`：战斗开始、回合行动、技能、状态、伤害、逃跑、胜负结算。
- `game-progression.js`：敌人获取与缩放、经验、升级、奖励、物品、装备、成长。
- `game-menu-shop.js`：菜单弹窗、背包、技能、装备、详情、系统页、商店库存和购买。
- `game-utils.js`：通用格式化、HTML 转义、技能 tooltip、实时存档读写、关闭弹窗、视觉动画、随机工具。
- `game.js`：页面事件绑定，最后调用 `newGame()` 启动游戏。
- `game-debug.js`: optional console debug helpers; loaded after `game.js`.

## 修改建议

- 调数值、事件、敌人、商店、道具时，优先改 `data/` 目录，不改游戏引擎。
- 改战斗规则时看 `game-battle.js`。
- 改界面显示或按钮布局时看 `game-ui.js` 和 `game-menu-shop.js`。
- 新增需要落盘的状态字段时，同时检查 `newGame()`、`loadGame()`、实时存档快照和相关渲染函数。
- 新增全局 helper 时尽量放到最贴近职责的文件里，只有真正通用的格式化/随机/弹窗关闭逻辑才放进 `game-utils.js`。
