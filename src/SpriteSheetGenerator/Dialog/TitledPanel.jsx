function addTitledPanel(container, title) {
    const pnl = container.add("panel");
    pnl.orientation = "column";
    pnl.alignment = "left";
    pnl.label = pnl.add("statictext", undefined, title);
    pnl.label.alignment = "left";
    return pnl;
}