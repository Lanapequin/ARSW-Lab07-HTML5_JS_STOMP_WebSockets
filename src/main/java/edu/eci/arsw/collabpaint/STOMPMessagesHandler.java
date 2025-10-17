package edu.eci.arsw.collabpaint;

import edu.eci.arsw.collabpaint.model.Point;
import edu.eci.arsw.collabpaint.model.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

@Controller
public class STOMPMessagesHandler {

    private final SimpMessagingTemplate msgt;
    private final Logger logger = Logger.getLogger(STOMPMessagesHandler.class.getName());
    private final Map<String, List<Point>> drawingPoints = new ConcurrentHashMap<>();

    @Autowired
    public STOMPMessagesHandler(SimpMessagingTemplate msgt) {
        this.msgt = msgt;
    }

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) {
        logger.log(Level.INFO, "Nuevo punto recibido en el servidor!: {0}", pt);
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);
        drawingPoints
                .computeIfAbsent(numdibujo, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(pt);

        List<Point> points = drawingPoints.get(numdibujo);

        if (points.size() >= 4) {
            List<Point> lastFour = points.subList(points.size() - 4, points.size());
            Polygon polygon = new Polygon(lastFour);
            msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);
            points.clear();
        }
    }
}
