<script setup>
definePageMeta({ layout: false }) 
const router = useRouter()

onMounted(() => {
  router.push('/dashboard')
})
</script>


