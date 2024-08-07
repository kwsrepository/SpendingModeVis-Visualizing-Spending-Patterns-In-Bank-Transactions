<template>
  <el-container>
<!--    <el-aside :width="sidebarVisible ? '200px' : '0px'">-->
<!--        <div class="toggle-button" @click="toggleSidebar">-->
<!--          <span v-html="sidebarVisible ? '&lt;' : '&gt;'"></span>-->
<!--        </div>-->

<!--        <div :class="['sidebar', { hidden: !sidebarVisible }]">-->
<!--          <router-link to="/page1" class="tab-link" active-class="active">Recreate Fig 1</router-link>-->
<!--          <router-link to="/page2" class="tab-link" active-class="active">Event Sequence 1</router-link>-->
<!--          <router-link to="/page3" class="tab-link" active-class="active">(color wheel)</router-link>-->
<!--          <router-link to="/page4" class="tab-link" active-class="active">Page 4</router-link>-->
<!--        </div>-->
<!--    </el-aside>-->

    <router-link to="/page2" class="tab-link" active-class="active"></router-link>

    <el-container>
      <router-view></router-view>
    </el-container>

  </el-container>
</template>

<script>
import { ElContainer } from 'element-plus'
// , ElHeader, ElMain, ElAside

export default {
  components: {
    ElContainer,
    // ElAside,
    // ElHeader,
    // ElMain,
  },
  data() {
    return {
      sidebarVisible: true
    };
  },
  methods: {
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible;
    }
  }
};
</script>

<style>
@import '@/assets/global.css';

.sidebar {
  width: 200px;
  background-color: #333;
  overflow: auto;
  transition: transform 0.3s ease;
}

.sidebar a {
  display: block;
  color: white;
  padding: 16px;
  text-decoration: none;
}

.sidebar a:hover {
  background-color: #ddd;
  color: black;
}

.sidebar a.active {
  background-color: grey;
  color: white;
}

.sidebar.hidden {
  transform: translateX(-200px);
}

.sidebar.hidden ~ .toggle-button {
  left: 0; /* 导航栏隐藏时，按钮保持在视野内 */
}

</style>
