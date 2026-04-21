package platzi.play.contenido;

public class Pelicula {
    public String titulo;
    public String descripcion;
    public int duracion;
    public String genero;
    public int anio;
    public double calificacion;
    public boolean disponible;


    public void reproducir() {
        System.out.println("Reproduciendo el pelicula..." + this.titulo);
    }

    public String obteneFichaTenica() {
        return this.titulo + " (" + anio + ")\n" +
                "Genero: " + genero + "\n" +
                "Calificacion: " + calificacion +"/5";
    }

    public void calificar(double calificacion) {
        if (calificacion >= 0 && calificacion <= 5) {
            this.calificacion = calificacion;
        }
    }

    public boolean esPopular() {
        return calificacion >= 4;
    }

}
