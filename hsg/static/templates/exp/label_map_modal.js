var LabelMapLen = 0
var LabelMap = []
var CategoryMap = []

function init_label_map_modal() {
    create_sortable('selected-label-map')
    new Sortable(document.getElementById('origin-label-map'), {
        ghostClass: "label-selected",
        //dragoverBubble: true,
        selectedClass: 'label-selected',
        chosenClass: 'label-selected',
        dragClass: 'label-selected',
        group: {
            name: 'labelmap',
            put: function (to, from, dragEl) {
                $(dragEl).remove()
                update_label_map_preview()
                return false
            },
            pull: "clone",

        },
        sort: true,
        onMove(event) {
            let to_level = $(event.to).parents('.nested-sortable').length;
            if (to_level > 0) {
                return false;
            }
            // 禁止labelmap重复
            let dragge_text = $(event.dragged).text()
            if (event.to.id === 'selected-label-map') {
                if (LabelMap.indexOf(dragge_text) != -1) {
                    return false
                }
                
                if (CategoryMap.some(item => item.toString() === [dragge_text].toString())) {
                    return false
                }
            } else {
                if ([].concat.apply([], CategoryMap).indexOf(dragge_text) != -1) {
                    return false
                }
            }
        }
    })
    $('#add_label_map').click(function () {
        if($('#search-label').val() === ''){
            return
        }
        $('#origin-label-map').append(`<div class="list-group-item list-group-item-action">${$('#search-label').val()}</div>`)
        $('#search-label').val('')
        search_label({ value: "" })
        $("#origin-label-counter").html(`label_maps: ${$("#origin-label-map").children().length}`)

    })
    $('#clear-label-map').click(function () {
        swal({
            title: "提示",
            text: "确认要清空已设置的标签信息吗?",
            icon: "warning",
            buttons: ['取消', '确定'],
            dangerMode: true,
         }).then(
            function(isConfirm){
                if(isConfirm){
                    $('#selected-label-map').html('')
                    update_label_map_preview()
                }
            }
        );
    })
}

function show_label_map_modal() {
    let is_init = false
    if ($('#selected-label-map').html() === '') {
        is_init = true
    }
    $('#origin-label-map').html('')
    let selected_data = $('#dataTable').DataTable().rows({ selected: true }).data().toArray()
    let defects = []
    for (let i = 0; i < selected_data.length; i++) {
        for (let j = 0; j < selected_data[i].defects.length; j++) {
            let defect = selected_data[i].defects[j]
            if (defects.indexOf(defect) == -1) {
                //初始化标签与已选标签
                $('#origin-label-map').append(`<div class="list-group-item list-group-item-action">${defect}</div>`)
                if (is_init) {
                    $('#selected-label-map').append(
                        `<div class="list-group-item list-group-item-action">${defect}<div class="list-group nested-sortable" id="nested-${defects.length}"></div></div>`)
                    create_sortable(`nested-${defects.length}`)
                }
                defects.push(defect)
            }
        }
    }
    $("#origin-label-counter").html(`label_maps: ${defects.length}`)
    update_label_map_preview()
    $('#label-map-modal').modal('show')
}

function search_label(e) {
    let label_maps = $('#origin-label-map').children()
    for (i = 0; i < label_maps.length; i++) {
        let text = label_maps[i].textContent || label_maps[i].innerText;
        if (text.indexOf(e.value) == -1) {
            label_maps[i].style.display = 'none'
        }
        else {
            label_maps[i].style.display = ''
        }
    }
}

function update_label_map_preview() {
    $('#selected-label-map .list-group-item').css('background', 'white')
    $('#selected-label-map .list-group-item').filter((k, v) => $(v).find('.list-group-item').length > 0).map((k, v) => $(v).css('background', '#E6ECF1'))

    let label_map_els = $("#selected-label-map").children()
    let all_category_map_els = $("#selected-label-map").find('.list-group-item').filter((k, v) => v.style.background === 'white')
    $(".selected-label-counter").html(`label-maps: ${label_map_els.length} &nbsp;&nbsp; category-map: ${all_category_map_els.length} `)

    // [{label_map:'ok',category_map:['ok','bg']}]
    LabelMap = []
    CategoryMap = []
    for (let i = 0; i < label_map_els.length; i++) {
        let label_map = $(label_map_els[i]).prop("firstChild").nodeValue
        let category_map_els = $(label_map_els[i]).children().children().filter((k, v) => v.style.background === 'white')
        let category_map = []
        for (let j = 0; j < category_map_els.length; j++) {
            category_map.push(category_map_els[j].textContent)
        }
        if (category_map.length == 0) {
            category_map = [label_map]
        }
        LabelMap.push(label_map)
        CategoryMap.push(category_map)
    }

    let code = document.createElement('code');
    let pre = document.getElementById('label-map-preview')
    code.className = 'language-yaml';
    pre.textContent = '';
    pre.appendChild(code);
    code.textContent = 'label_map:\n'
    for (let i = 0; i < LabelMap.length; i++) {
        code.textContent += `    - ${LabelMap[i]}\n`
    }
    code.textContent += 'category_map:\n'
    for (let i = 0; i < LabelMap.length; i++) {
        code.textContent += `    - - ${CategoryMap[i][0]}\n`
        for (let j = 1; j < CategoryMap[i].length; j++) {
            code.textContent += `      - ${CategoryMap[i][j]}\n`
        }
    }
    Prism.highlightElement(code);
}

function create_sortable(id) {
    new Sortable(document.getElementById(id), {
        ghostClass: "selected",
        //dragoverBubble: true,
        selectedClass: 'selected',
        chosenClass: 'selected',
        dragClass: 'selected',
        emptyInsertThreshold: 15,
        group: {
            name: 'labelmap',
            pull: function (to, from, dragEl) {
                if ($(dragEl).find('.list-group-item').length > 0)
                    return false
            },
            put: true,
        },
        onStart(event) {
        },
        onMove(event) {
            let to_level = $(event.to).parents('.nested-sortable').length;
            if (to_level > 0) {
                return false;
            }
        },
        onAdd(event) {
            let label = $(event.item).text()
            $(event.item).append(`<div class="list-group nested-sortable" id="nested-${LabelMapLen}"></div>`)
            create_sortable(`nested-${LabelMapLen}`)
            // 没有nested的为labelmap
            update_label_map_preview()
        },
        onSort(event) {
            update_label_map_preview()
        },
        animation: 150,
        fallbackOnBody: true,
        //removeOnSpill: true,
        swapThreshold: 0.1,
        //invertSwap:true,
        sort: true,
    })
    LabelMapLen += 1
}           
