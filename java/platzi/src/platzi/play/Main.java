package platzi.play;

import platzi.play.contenido.Pelicula;
import platzi.play.plataforma.User;

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Platzi Play💕");

        Pelicula pelicula = new Pelicula();
        pelicula.titulo = "Mario";
        pelicula.anio = 2026;
        pelicula.genero = "Fantasia";
        pelicula.calificar(4);

        User usuario = new User();
        usuario.nombre = "Axel";

        usuario.ver(pelicula);

        /*Scanner scanner = new Scanner(System.in);
        System.out.println("Cual es su nombre: ");
        String nombre = scanner.nextLine();

        System.out.println("Hola " + nombre + ", esto platzi play");

        System.out.println(nombre + ", cuantos años tienes?");
        int edad = scanner.nextInt();

        System.out.println(nombre + " puede ver contenido +" + edad);*/
    }
}
