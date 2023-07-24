//@include "CheckBox.jsx"
//@include "NumberInput.jsx"
//@include "RadioButtonSet.jsx"
//@include "SaveFilePicker.jsx"
//@include "TitledPanel.jsx"

const gDialogConstants = {
    indent: 16 // px
};

function addCancelAndOKButtons(dlg, okText, cancelText) {
    const grp = dlg.add("group");
    const okBtn = grp.add("button", undefined, okText);
    const cancelBtn = grp.add("button", undefined, cancelText);

    dlg.defaultElement = okBtn;
    dlg.cancelElement = cancelBtn;
}