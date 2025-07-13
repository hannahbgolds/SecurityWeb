export async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
  
    try {
      const response = await fetch(url)
      const data = await response.json()
      return data.display_name || 'Endereço não encontrado'
    } catch (error) {
      console.error('Erro ao buscar endereço:', error)
      return 'Erro na geocodificação'
    }
  }
  