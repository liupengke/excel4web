<script setup>
import { onMounted, ref } from "vue";
import Excel from "../lib";
import mockData from "./data";

const editor = ref(null);
const columns = [
	{
		title: "skuid",
		width: 200,
		dataIndex: "skuid",
		editable: false,
	},
	{
		type: "search",
		width: 40,
	},
	{
		title: "商品名称",
		dataIndex: "goods_name",
		width: {
			flex: 1.5,
			min: 300,
			max: 500,
		},
	},
	{
		title: "商品名(英文)",
		dataIndex: "goods_name_en",
		width: {
			flex: 1.5,
			min: 300,
			max: 500,
		},
	},
	{
		title: "规格型号",
		dataIndex: "model",
		width: {
			flex: 1,
			min: 200,
			max: 400,
		},
	},
	{
		title: "净重",
		dataIndex: "net_weight",
		width: {
			flex: 1,
			min: 200,
			max: 400,
		},
	},
];
onMounted(() => {
	const excel = new Excel({
		el: editor.value,
		columns,
	});
	excel.updateRecords(mockData.data.list);
});
</script>

<template>
	<div class="playground">
		<header class="header"></header>
		<div class="panel" ref="editor"></div>
	</div>
</template>

<style scoped>
.playground {
	height: 100%;
	display: flex;
  flex-direction: column;
}
.header {
	height: 120px;
	background-color: #f0f0f0;
}
.panel {
	flex: 1;
}
</style>
