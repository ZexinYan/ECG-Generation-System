//listener

function merge_label_map(left_map, right_map) {
    // 合并label map
    let label_map = { ...left_map, ...right_map }

    for (var key in label_map) {
        label_map[key] = left_map[key] + right_map[key] || left_map[key] || right_map[key];
    }
    return label_map
}

function checked_train_set(data_name) {

    var all_dataset = $('#dataTable-selected').DataTable().rows().data().toArray()
    all_dataset.forEach(function (value, index) {
        if (value.data_name === data_name) {
            value.checked_train_set = !value.checked_train_set
        }
    })
    //update_selected_data_table()
}

function weight_set_input(id) {
    var select_dataset = $('#dataTable-selected').DataTable().rows().data().toArray()
    select_dataset.forEach(function (value, index) {
        if (value.ID == id) {
            value.weight_set_input = parseInt($(`#weight_data_${id}`).val())
        }
    })
}
function checked_target_set(id) {
    var select_dataset = $('#dataTable-selected').DataTable().rows().data().toArray()
    select_dataset.forEach(function (value, index) {
        if (value.ID == id) {
            value.checked_target_set = !value.checked_target_set
        } else {
            value.checked_target_set = false
        }
    })
    // 实现单选
    $(`[id^='target_data_']`).prop('checked', false)
    $(`#target_data_${id}`).prop('checked', true)
}

function back(){
    history.go(-1)
}

$('#hpo').change(function () {
    var use_hpo = $('#hpo').is(":checked");
    if (use_hpo) {
        $('#register_hyperparameter_form').attr('hidden', true);
        $('#register_hpo_hyperparameter_form').removeAttr('hidden');
    } else {
        $('#register_hyperparameter_form').removeAttr('hidden');
        $('#register_hpo_hyperparameter_form').attr('hidden', true);
    }
})


$('#data-group-checkbox').change(function(e){
    let checkbox = $('#data-group-checkbox').is(":checked");
    if (checkbox){
        $('#data-group-content').show()
    }else{
        $('#data-group-content').hide()
    }
})

$('#rank_dataset').change(function e() {
    let type = $('#rank_dataset').val()
    let table = $('#dataTable-selected').DataTable();

    // 初始化表格状态

    table.column(7).visible(false);
    table.column(8).visible(false);
    if (type === 'use_last_iter') {
    } else if (type === 'target_dataset') {
        table.column(8).visible(true);
    } else if (type === 'dataset_weight') {
        table.column(7).visible(true);
    }
})

$('#templates_select').change(function e() {
    let type = $('#templates_select').val();
    $('#template_desc').text(Templates[type]);
});

function confirm_create_exp(page) {
    let conf_ctx = $('#confirm-content')
    conf_ctx.html('')
    if (ExpType === 'train'){
        conf_ctx.append(`
            <div class="mb-3">
                <label>实验目的: ${$('#goal').val()}</label>
            </div>
            <hr>`)
        }
    var table = $('#expTagDataTable').DataTable();
    var data = table.rows({ selected: true }).data();
    conf_ctx.append(`<div class="mb-3"><label>标签: `);
    for (var i = 0; i < data.length; i++) {
        conf_ctx.append(`<div class='badge bg-${data[i].color} text-white rounded-pill'>${data[i].name}</div>: ${data[i].desc} <br>`);
    }
    conf_ctx.append(`</label></div><hr>`);
    if (BaseExpID) {
        conf_ctx.append(`
            <div class="mb-3">
                Base实验: <div class="badge bg-success text-white rounded-pill">
                ${BaseExpName}</label>
            </div>
            <hr>`)
    }

    conf_ctx.append(`
        <div class="mb-3">
            实验模板: <div class="badge bg-primary text-white rounded-pill">
                ${Templates[$('#templates_select').val()]}</div>
        </div>
        <hr>
    `)

    let task_type = $('#hpo').is(":checked") ? 'hpo' : 'common'
    let source_text = '实验复制'
    if (SourceType === 'new') {
        source_text = '新实验'
    }
    else if (SourceType === 'parameter') {
        source_text = '实验调参'
    }
    else if (SourceType === 'data') {
        source_text = '数据迭代'
    }

    conf_ctx.append(`<div class="mb-3">
        实验类型: <div class="badge bg-orange text-white rounded-pill">${source_text}</div>
    </div><hr>`)

    if ($.fn.DataTable.isDataTable('#dataTable-selected')) {
        let select_dataset = $('#dataTable-selected').DataTable().rows().data().toArray()
        let dataset_summary = {
            train_image: { ok: 0, total: 0 },
            val_image: { ok: 0, total: 0 },
            train_label: {},
            val_label: {},
            total_label: {}
        }
        for (let index = 0; index < select_dataset.length; index++) {
            let dataset = select_dataset[index]
            // 统计总图片张数
            dataset_summary.train_image.total += dataset['train_img_num']
            dataset_summary.val_image.total += dataset['val_img_num']

            // 统计ok图片张数
            dataset_summary.train_image.ok += dataset['image_num_map'].train.OK
            dataset_summary.val_image.ok += dataset['image_num_map'].val.OK

            // 统计缺陷分布
            Object.assign(dataset_summary.train_label, merge_label_map(dataset_summary.train_label, dataset['label_num_map'].train))
            Object.assign(dataset_summary.val_label, merge_label_map(dataset_summary.val_label, dataset['label_num_map'].val))

            if (dataset.checked_train_set) {
                // 训练集加入测试
                dataset_summary.val_image.ok += dataset['image_num_map'].train.OK
                dataset_summary.val_image.total += dataset['train_img_num']
                Object.assign(dataset_summary.val_label, merge_label_map(dataset_summary.val_label, dataset['label_num_map'].train))
            }
        }
        conf_ctx.append(`<table data-bs-toggle="table" class="table table-bordered">
            <thead class="thead-light">
            <tr>
                <th>图片张数</th>
                <th>训练</th>
                <th>测试</th>
                <th>总计</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>总体数据</td>
                <td>${dataset_summary.train_image.total}</td>
                <td>${dataset_summary.val_image.total}</td>
                <td id='total_sum'>${dataset_summary.train_image.total + dataset_summary.val_image.total}</td>
            </tr>
            <tr>
                <td>合格样本</td>
                <td>${dataset_summary.train_image.ok}</td>
                <td>${dataset_summary.val_image.ok}</td>
                <td>${dataset_summary.train_image.ok + dataset_summary.val_image.ok}</td>
            </tr>
            </tbody>
        </table>
        `)

        // 缺陷分布
        conf_ctx.append(`
        <div class="card-body">
            <ul class="nav nav-tabs" id="tabs" role="tablist">
                <li class="nav-item">
                    <a class="nav-link active me-1"
                        id="tabs-0"
                        data-bs-toggle="tab" href="#page-0"
                        role="tab"
                        aria-controls="tabs-0""
                        aria-selected="true">
                        <i class="fa fa-database text-orange me-1"></i>
                        总分布
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link me-1"
                        id="tabs-1"
                        data-bs-toggle="tab" href="#page-1"
                        role="tab"
                        aria-controls="tabs-1""
                        aria-selected="true">
                        <i class="fa fa-tint text-orange me-1"></i>
                        训练集
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link me-1"
                        id="tabs-2"
                        data-bs-toggle="tab" href="#page-2"
                        role="tab"
                        aria-controls="tabs-2""
                        aria-selected="true">
                        <i class="fab fa-trello text-orange me-1"></i>
                        测试集
                    </a>
                </li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane active" id="page-0" role="tabpanel" aria-labelledby="page-0">
                    <div class="chart-pie pb-2">
                        <canvas id="dataset-total-pie"></canvas>
                    </div>
                </div>
                <div class="tab-pane" id="page-1" role="tabpanel" aria-labelledby="page-1">
                    <div class="chart-pie pb-2">
                        <canvas id="dataset-train-pie"></canvas>
                    </div>
                </div>
                <div class="tab-pane" id="page-2" role="tabpanel" aria-labelledby="page-2">
                    <div class="chart-pie pb-2">
                        <canvas id="dataset-val-pie"></canvas>
                    </div>
                </div>
            </div>
        </div>
        `)
        Object.assign(dataset_summary.total_label, merge_label_map(dataset_summary.train_label, dataset_summary.val_label))

        init_pie_chart("dataset-total-pie", dataset_summary.total_label)
        init_pie_chart("dataset-train-pie", dataset_summary.train_label)
        init_pie_chart("dataset-val-pie", dataset_summary.val_label)
    }
    conf_ctx.append('<hr>')

    let data_group_checkbox = $('#data-group-checkbox').is(":checked");
    if (data_group_checkbox){
        let dataset_group_content = `<div class="mb-3">数据组合：<br>`
        let select_group_dataset = $('#dataGroupTable').DataTable().rows().data().toArray()
            for(let index=0; index < select_group_dataset.length; index++){
                let group_data = select_group_dataset[index]
                dataset_group_content += `
                <a href='/data_group/detail/${group_data.ID}/' style="border: none;" 
                class="badge bg-primary text-white rounded-pill">
                ${group_data.name} - V${group_data.version}
                </a>:  ${group_data.comment}<br>`
            }
        conf_ctx.append(`${dataset_group_content}</div>`)
    }



    let dataset_content = $('#dataset-content').clone()
    dataset_content[0].id = 'dataset-content-1'
    conf_ctx.append(dataset_content)
    $("#dataset-content-1 :input").prop("disabled", true);
    $('#dataset-content-1 .dataTables_length').hide()
    $('#dataset-content-1 .dataTables_filter').hide()
    $('#dataset-content-1 .dtsp-panesContainer').hide()

    conf_ctx.append('<hr>')

    if (task_type == 'common') {
        for (let key in CommonHyperparameterConfig) {
            let param_cfg = CommonHyperparameterConfig[key]
            Hyperparameter[param_cfg['name']] = $(`#common_${param_cfg['type']}_${param_cfg['name']}`).val()
        }
    } else {
        for (let key in HPOHyperparameterConfig) {
            let param_cfg = HPOHyperparameterConfig[key]
            Hyperparameter[param_cfg['name']] = $(`#hpo_${param_cfg['type']}_${param_cfg['name']}`).val()
        }
    }
    let label_map_block = $('#label-map-preview').clone()
    label_map_block[0].id = 'label-map-preview-1'

    let parameter_block = ''
    for (let key in Hyperparameter) {
        parameter_block += `
        <div class="mb-3">
            <div class="badge bg-primary text-white rounded-pill">${key}</div>：${Hyperparameter[key]}
        </div>`
    }

    conf_ctx.append(`
        <div class="card-body">
            <ul class="nav nav-tabs" id="hyper-tabs" role="tablist">
                <li class="nav-item">
                    <a class="nav-link active me-1"
                        id="hyper-tabs-0"
                        data-bs-toggle="tab" href="#hyper-page-0"
                        role="tab"
                        aria-selected="true">
                        <i class="fa fa-sitemap text-orange me-1"></i>
                        超参数
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link me-1"
                        ${ExpType === 'train' ? "": "hidden"}
                        id="hyper-tabs-1"
                        data-bs-toggle="tab" href="#hyper-page-1"
                        role="tab"
                        aria-selected="true">
                        <i class="fa fa-terminal text-orange me-1"></i>
                        Labelmap
                    </a>
                </li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane active" id="hyper-page-0" role="tabpanel">
                    <div class="mx-3 my-3">
                        ${parameter_block}
                    </div>
                </div>
                <div class="tab-pane" id="hyper-page-1" role="tabpanel">
                    <div class="mx-3 my-3">
                        ${label_map_block[0].outerHTML}
                    </div>
                </div>
            </div>
        </div>
        `)
}

