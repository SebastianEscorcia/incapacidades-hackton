import { Component, input, signal } from "@angular/core"
import { CommonModule } from "@angular/common"

interface CarouselItem {
    id: number
    title: string
    description: string
    image: string
    link: string
}

@Component({
    selector: "app-expandable-carousel",
    standalone: true,
    imports: [CommonModule],
    templateUrl: "./expandable-carousel.component.html",
    styleUrl: "./expandable-carousel.component.scss",
})
export class ExpandableCarouselComponent {
    activeIndex = signal<number>(2)

    public items = input<CarouselItem[]>([
        {
            id: 0,
            title: "Limpieza Dental",
            description: "Mantén tu sonrisa brillante con nuestros tratamientos profesionales",
            image: "https://clinicamaip.com/wp-content/uploads/2022/05/beneficios-limpieza-dental-1021x640.jpg",
            link: "/servicios/limpieza",
        },
        {
            id: 1,
            title: "Ortodoncia",
            description: "Alinea tu sonrisa con las últimas técnicas en ortodoncia",
            image: "https://www.teeth22.com/wp-content/uploads/2018/11/cuidar-los-dientes-durante-tratamiento-ortodoncia-1024x511.jpg",
            link: "/servicios/ortodoncia",
        },
        {
            id: 2,
            title: "Implantes Dentales",
            description: "Recupera tu sonrisa con implantes de última generación",
            image: "https://www.dentisalud.com.co/hubfs/de-que-estan-hechas-las-pr%C3%B3tesis-dentales.jpg",
            link: "/servicios/implantes",
        },
        {
            id: 3,
            title: "Blanqueamiento",
            description: "Ilumina tu sonrisa con nuestro blanqueamiento profesional",
            image: "https://universidadeuropea.com/resources/media/images/que-es-blanqueamiento-dental-1200x630.original.jpg",
            link: "/servicios/blanqueamiento",
        },
        {
            id: 4,
            title: "Odontopediatría",
            description: "Cuidado dental especializado para los más pequeños",
            image: "https://www.dentistainfantiltoledo.com/wp-content/uploads/2023/08/shutterstock_153165995-1.jpg",
            link: "/servicios/odontopediatria",
        },
    ]
    )
    setActive(index: number): void {
        this.activeIndex.set(index)
    }
}
